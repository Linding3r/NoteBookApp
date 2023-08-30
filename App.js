import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Button, FlatList, TouchableOpacity } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  const Stack = createNativeStackNavigator();

  const [notes, setNotes] = useState([]);

  const addNote = newNote => {
    if (newNote) {
      setNotes([...notes, newNote]);
    }
  };

  return (
    <NavigationContainer>
    <Stack.Navigator initialRouteName="Page1">
      <Stack.Screen name="NoteBook">
        {props => <Page1 {...props} notes={notes} />}
      </Stack.Screen>
      <Stack.Screen name="New Note">
        {props => <Page2 {...props} onNoteAdded={addNote} />}
      </Stack.Screen>
      <Stack.Screen name="EditNote" component={EditNote} />
    </Stack.Navigator>
  </NavigationContainer>
  );
}

const Page1 = ({ navigation, notes, setNotes }) => {
  const handleNoteEdit = (index) => {
    navigation.navigate("EditNote", {
      noteIndex: index,
      noteContent: notes[index],
      notes: notes,
      setNotes: setNotes,
    });
  };

  return (
    <View style={styles.container}>
      <Button title="New Note" onPress={() => navigation.navigate("New Note")} />
      <FlatList
        data={notes}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => handleNoteEdit(index)}>
            <Text style={styles.note}>{item.slice(0, 30)}...</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const Page2 = ({ navigation, onNoteAdded }) => {
  const [typedMessage, setTypedMessage] = useState("");

  const addNoteAndNavigate = () => {
    if (typedMessage) {
      onNoteAdded(typedMessage);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Add New Note" onPress={addNoteAndNavigate} />
      <TextInput
        multiline
        numberOfLines={100}
        style={styles.input}
        placeholder="Enter your note..."
        value={typedMessage}
        onChangeText={text => setTypedMessage(text)}
      />
    </View>
  );
};

const EditNote = ({ navigation, route }) => {
  const { noteIndex, noteContent, notes, setNotes } = route.params;

  const [editedNote, setEditedNote] = useState(noteContent);

  const handleNoteUpdate = () => {
    if (editedNote) {
      const updatedNotes = [...notes];
      updatedNotes[noteIndex] = editedNote;
      setNotes(updatedNotes);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Edit your note..."
        value={editedNote}
        onChangeText={text => setEditedNote(text)}
      />
      <Button title="Update Note" onPress={handleNoteUpdate} />
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    padding: 8,
    marginBottom: 8,
  },
  note: {
    fontSize: 16,
    marginBottom: 8,
  },
});
