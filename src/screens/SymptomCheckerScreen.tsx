import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';

const SymptomCheckerScreen = () => {
  const [symptoms, setSymptoms] = useState('');

  const check = () => {
    const s = symptoms.toLowerCase();
    let suggestion = 'Monitor at home and book a consultation if symptoms persist.';
    if (s.includes('chest pain') || s.includes('shortness of breath')) suggestion = 'Seek urgent care immediately.';
    else if (s.includes('fever') && s.includes('cough')) suggestion = 'Consider COVID/flu testing and rest; book a visit.';
    else if (s.includes('rash')) suggestion = 'Schedule a dermatology consultation.';
    Alert.alert('Triage Suggestion', suggestion);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Symptom Checker</Text>
      <Text style={{ color: '#555', marginBottom: 12 }}>Describe your symptoms</Text>
      <TextInput value={symptoms} onChangeText={setSymptoms} multiline style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, minHeight: 120 }} />
      <TouchableOpacity onPress={check} style={{ marginTop: 16, backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Check</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SymptomCheckerScreen;
