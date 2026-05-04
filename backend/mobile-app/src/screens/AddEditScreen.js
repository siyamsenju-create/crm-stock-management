import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';

const AddEditScreen = ({ route, navigation }) => {
  // Check if we're editing an existing item
  const item = route?.params?.item;
  const isEditing = !!item;

  const [name, setName] = useState(item?.name || '');
  const [quantity, setQuantity] = useState(item?.quantity?.toString() || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !quantity || !price) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        name, 
        quantity: Number(quantity), 
        price: Number(price) 
      };

      if (isEditing) {
        await api.put(`/products/${item._id || item.id}`, payload);
        Alert.alert('Success', 'Product updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await api.post('/products', payload);
        Alert.alert('Success', 'Product added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save product';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Product Name"
              placeholder="e.g. Premium Paint"
              value={name}
              onChangeText={setName}
            />
            
            <Input
              label="Quantity"
              placeholder="e.g. 50"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <Input
              label="Price"
              placeholder="e.g. 199.99"
              keyboardType="decimal-pad"
              value={price}
              onChangeText={setPrice}
            />

            <Button 
              title={isEditing ? "Update Product" : "Save Product"} 
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: 16 }}
            />
            
            <Button 
              title="Cancel" 
              type="secondary"
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default AddEditScreen;
