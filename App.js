import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { app, database, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button, Icon, FAB, ListItem, Divider } from '@rneui/themed';
import * as ImagePicker from 'expo-image-picker';

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
                    <Icon name="notes" />
                    <ListItem.Content>
                        <TouchableOpacity onPress={() => handleNoteEdit(item)}>
                            <ListItem.Title>{shortNote}</ListItem.Title>
                        </TouchableOpacity>
                    </ListItem.Content>
                </ListItem.Swipeable>
                <Text style={styles.separator} />
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
    const [imagePath, setImagePath] = useState('');
    // Hook not working. It never sets the imageId
    //const [imageId, setImageId] = useState('');
    let imageId = '';


    const addNote = async () => {
        if (noteTitle && noteContent) {
            try {
                if (imagePath) {
                    await uploadImage(); // Wait for the image upload to complete
                }
                const noteData = {
                    note_title: noteTitle,
                    note_body: noteContent,
                    image_id: imageId, 
                };
               
    
                await addDoc(collection(database, 'notes'), noteData);
    
                navigation.goBack();
            } catch (err) {
                console.error('Error adding note:', err);
            }
        }
    };

    async function launchImagePicker() {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
        });
        if (result.canceled) {
            return;
        } else {
            setImagePath(result.assets[0].uri);
        }
    }

    async function uploadImage() {
        const response = await fetch(imagePath);
        const blob = await response.blob();
    
        // Generate a unique file name using a timestamp
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}_${Math.floor(Math.random() * 999999999999)}`;
    
        const storageRef = ref(storage, `images/${fileName}`);
    
        try {
            const snapshot = await uploadBytes(storageRef, blob);
            console.log('Uploaded an Image to Firebase!');
            //setImageId(fileName); // Set imageId here which is not working
            imageId = fileName;
        } catch (error) {
            console.error('Error uploading image to Firebase:', error.code, error.message, error.stack);
        }
    }
    

    return (
        <View style={styles.container}>
            <TextInput multiline style={styles.inputTitle} placeholder="Enter a title..." value={noteTitle} onChangeText={text => setNoteTitle(text)} />
            <ScrollView style={{ maxHeight: 250 }}>
            <TextInput multiline style={styles.input} placeholder="Enter your note..." value={noteContent} onChangeText={text => setNoteContent(text)} />
            {imagePath && <Image source={{ uri: imagePath }} style={{ width: 300, height: 250 }} />}
            </ScrollView>
            <FAB icon={{ name: 'save', color: 'white' }} placement="right" color="#24a0ed" onPress={addNote} />
            <FAB icon={{ name: 'image', color: 'white' }} placement="left" color="#24a0ed" onPress={launchImagePicker} />
        </View>
    );
};

const EditNotePage = ({ navigation, route }) => {
    const { note } = route.params;

    const [editedNoteTitle, setEditedNoteTitle] = useState(note.note_title);
    const [editedNoteContent, setEditedNoteContent] = useState(note.note_body);
    const [imagePath, setImagePath] = useState(note.image_path);
    const [imageId, setImageId] = useState(note.image_id);


    useEffect(() => {
        // Fetch the image URL using the image ID
        if (imageId) {
            const storageRef = ref(storage, `images/${imageId}`);
            getDownloadURL(storageRef)
                .then(url => {
                    setImagePath(url);
                })
                .catch(error => {
                    console.error('Error fetching image URL:', error);
                });
        }
    }, [imageId]);

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

    async function downloadImage() {
        const storageRef = ref(storage, 'images/' + imageId);
        getDownloadURL(storageRef)
            .then(url => {
                setImagePath(url);
            })
            .catch(error => {
                console.log(error);
            });
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
            {imagePath && <Image source={{ uri: imagePath }} style={{ width: 300, height: 250 }} />}
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
