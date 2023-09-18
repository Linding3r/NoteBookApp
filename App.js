import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { app, database } from './firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button, Icon, FAB, ListItem, Divider } from '@rneui/themed';
import * as ImagePicker from 'expo-image-picker'


const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Page1">
                <Stack.Screen name="NoteBook" component={MainPage} />
                <Stack.Screen name="New Note" component={NewNotePage} />
                <Stack.Screen name="EditNote" component={EditNotePage} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const MainPage = ({ navigation }) => {
    const [values, loading, error] = useCollection(collection(database, 'notes'));
    const notes = values?.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    const handleNoteEdit = note => {
        navigation.navigate('EditNote', {
            note,
        });
    };

    const handleNoteDelete = async noteId => {
        try {
            await deleteDoc(doc(database, 'notes', noteId));
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    const renderNoteItem = ({ item }) => {
        const shortNote = item.note_title.length > 30 ? `${item.note_title.slice(0, 30)}...` : item.note_title;
        return (
            <View>
            <ListItem.Swipeable
                rightContent={
                    <Button icon={{ name: 'delete', color: 'white' }} buttonStyle={{ backgroundColor: 'red' }} onPress={() => handleNoteDelete(item.id)} />
                }
                rightActionActivationDistance={200}
            >
                <Icon name="notes"/>
                <ListItem.Content>
                    <TouchableOpacity onPress={() => handleNoteEdit(item)}>
                        <ListItem.Title>
                            {shortNote}
                            </ListItem.Title>
                    </TouchableOpacity>
                </ListItem.Content>
            </ListItem.Swipeable>
            <Text style={styles.separator}/>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList style={styles.notelist} data={notes} renderItem={renderNoteItem} keyExtractor={item => item.id} />
            <FAB
                icon={{ name: 'add', color: 'white' }}
                placement="right"
                color="#24a0ed"
                onPress={() => {
                    navigation.navigate('New Note');
                }}
            />
        </View>
    );
};

const NewNotePage = ({ navigation }) => {
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    const addNote = async () => {
        if (noteTitle && noteContent) {
            try {
                await addDoc(collection(database, 'notes'), {
                    note_title: noteTitle,
                    note_body: noteContent,
                });
                navigation.goBack();
            } catch (err) {
                console.error('Error adding note:', err);
            }
        }
    };

    return (
        <View style={styles.container}>
            <TextInput multiline style={styles.inputTitle} placeholder="Enter a title..." value={noteTitle} onChangeText={text => setNoteTitle(text)} />
            <TextInput multiline style={styles.input} placeholder="Enter your note..." value={noteContent} onChangeText={text => setNoteContent(text)} />
            <FAB icon={{ name: 'save', color: 'white' }} placement="right" color="#24a0ed" onPress={addNote} />
        </View>
    );
};

const EditNotePage = ({ navigation, route }) => {
    const { note } = route.params;

    const [editedNoteTitle, setEditedNoteTitle] = useState(note.note_title);
    const [editedNoteContent, setEditedNoteContent] = useState(note.note_body);

    const handleNoteUpdate = async () => {
        if (editedNoteTitle && editedNoteContent) {
            try {
                await updateDoc(doc(database, 'notes', note.id), {
                    note_title: editedNoteTitle,
                    note_body: editedNoteContent,
                });
                navigation.goBack();
            } catch (err) {
                console.error('Error updating note:', err);
            }
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                multiline
                style={styles.inputTitle}
                placeholder="Edit note title..."
                value={editedNoteTitle}
                onChangeText={text => setEditedNoteTitle(text)}
            />
            <TextInput
                multiline
                style={styles.input}
                placeholder="Edit your note..."
                value={editedNoteContent}
                onChangeText={text => setEditedNoteContent(text)}
            />
            <FAB icon={{ name: 'save', color: 'white' }} placement="right" color="#24a0ed" onPress={handleNoteUpdate} />
        </View>
    );
};

const styles = StyleSheet.create({
    notelist: {
        marginTop: 20,
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputTitle: {
        padding: 8,
        marginTop: 35,
        textAlignVertical: 'top',
        fontSize: 20,
    },
    input: {
        padding: 8,
        marginTop: 35,
        textAlignVertical: 'top',
    },
    note: {
        fontSize: 20,
    },
    notebox: {
        marginTop: 35,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginVertical: 15,
    },
});
