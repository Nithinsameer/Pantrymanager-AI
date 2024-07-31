'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, Modal, TextField, AppBar, Toolbar, 
  Paper, Tabs, Tab, Snackbar, Alert, CircularProgress, Card, CardContent, 
  CardActions, Grid, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { Camera } from "react-camera-pro";
import { firestore } from '@/firebase';
import { collection, getDocs, query, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore/lite';
import ReactMarkdown from 'react-markdown';
import { styled } from '@mui/material/styles';

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: This is not recommended for production use
});

const StyledMarkdown = styled('div')(({ theme }) => ({
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  '& p': {
    marginBottom: theme.spacing(2),
  },
  '& ul, & ol': {
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(3),
  },
  '& li': {
    marginBottom: theme.spacing(1),
  },
}));


const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const recipemodalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 600,
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflow: 'auto',
};

// Updated OpenAI Vision API function
const classifyImageWithAPI = async (base64Image) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What pantry item is in this image? If it's a pantry item typically found in a pantry, respond with just the name of the item. If it's not a typical pantry item or not a food item at all, respond with 'not pantry item'." },
            {
              type: "image_url",
              image_url: {
                "url": `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 50
    });

    console.log('OpenAI API Response:', response);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error('Failed to classify image');
  }
};

export default function Home() {
  const [pantry, setPantry] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPantry, setFilteredPantry] = useState([]);
  const [addItemMethod, setAddItemMethod] = useState(0); // 0 for text, 1 for camera
  const [newItemName, setNewItemName] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [recipe, setRecipe] = useState('');
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [facingMode, setFacingMode] = useState('user');

  const camera = useRef(null);

  useEffect(() => {
    console.log('Recipe state updated:', recipe);
  }, [recipe]);
  
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      setIsApiKeySet(!!apiKey);
      if (!apiKey) {
        console.error('OpenAI API key is not set in environment variables');
      } else {
        console.log('API key is set');
      }
    };
    checkApiKey();
  }, []);

  const updatePantry = async () => {
    const snapshot = query(collection(firestore, 'pantry'));
    const pantryList = [];
    const docs = await getDocs(snapshot);
    docs.forEach((doc) => {
      pantryList.push({ id: doc.id, ...doc.data() });
    });
    setPantry(pantryList);
    setFilteredPantry(pantryList);
  };

  useEffect(() => {
    updatePantry();
  }, []);

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item.toLowerCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { count } = docSnap.data();
      await setDoc(docRef, { count: count + 1 });
    } else {
      await setDoc(docRef, { count: 1 });
    }
    await updatePantry();
  };

  const increaseItemCount = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { count } = docSnap.data();
      await setDoc(docRef, { count: count + 1 });
    }
    await updatePantry();
  };

  const decreaseItemCount = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { count } = docSnap.data();
      if (count > 1) {
        await setDoc(docRef, { count: count - 1 });
      } else {
        await deleteDoc(docRef);
      }
    }
    await updatePantry();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item);
    await deleteDoc(docRef);
    await updatePantry();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    const filteredItems = pantry.filter((item) =>
      item.id.toLowerCase().includes(event.target.value.toLowerCase())
    );
    setFilteredPantry(filteredItems);
  };

  const handleCapture = useCallback(async () => {
    if (!isApiKeySet) {
      setErrorMessage('OpenAI API key is not set. Cannot classify image.');
      return;
    }

    setIsClassifying(true);
    try {
      const imageSrc = camera.current.takePhoto();
      const base64Image = imageSrc.split(',')[1];
      console.log('Sending image to OpenAI API...');
      const classifiedItem = await classifyImageWithAPI(base64Image);
      console.log('Classified item:', classifiedItem);
      
      if (classifiedItem.toLowerCase() === 'not pantry item') {
        setErrorMessage('Please try with a pantry item.');
        setIsClassifying(false);
        return;
      }
      
      await addItem(classifiedItem);
      handleClose();
    } catch (error) {
      console.error('Error during image capture and classification:', error);
      setErrorMessage('Failed to classify image. Please try again.');
    } finally {
      setIsClassifying(false);
    }
  }, [isApiKeySet, addItem]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewItemName('');
    setAddItemMethod(0);
    setErrorMessage('');
  };

  const handleAddItem = () => {
    if (addItemMethod === 0 && newItemName.trim()) {
      addItem(newItemName.trim());
      handleClose();
    } else if (addItemMethod === 1) {
      handleCapture();
    }
  };

  const getAllPantryItems = async () => {
    const snapshot = query(collection(firestore, 'pantry'))
    const pantryList = []
    const docs = await getDocs(snapshot)
    docs.forEach((doc) => {
      pantryList.push(doc.id)
    })
    return pantryList
  }

  const generateRecipe = async (ingredients) => {
    try {
      console.log('Generating recipe with ingredients:', ingredients);
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates recipes based on available ingredients."
          },
          {
            role: "user",
            content: `Generate a recipe using some or all of these ingredients: ${ingredients.join(', ')}. Provide only a list of ingredients with quantities and succinct step-by-step instructions.`
          }
        ],
        max_tokens: 500
      });
  
      console.log('OpenAI API Response:', response);
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      if (error.response) {
        console.error("OpenAI API error response:", error.response.data);
      }
      throw new Error('Failed to generate recipe: ' + error.message);
    }
  };

  const handleGenerateRecipe = async () => {
    setIsGeneratingRecipe(true);
    setErrorMessage('');
    try {
      const ingredients = await getAllPantryItems();
      console.log('Retrieved pantry items:', ingredients);
      
      if (ingredients.length === 0) {
        throw new Error('No ingredients found in the pantry.');
      }
      
      const generatedRecipe = await generateRecipe(ingredients);
      console.log('Generated recipe:', generatedRecipe); // Add this line for debugging
      setRecipe(generatedRecipe);
      setRecipeModalOpen(true);
    } catch (error) {
      console.error('Error in handleGenerateRecipe:', error);
      setErrorMessage(`Failed to generate recipe: ${error.message}`);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const flipCamera = () => {
    if (camera.current) {
      const newMode = camera.current.switchCamera();
      setFacingMode(newMode);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pantry Manager
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleGenerateRecipe}
            disabled={isGeneratingRecipe}
            startIcon={isGeneratingRecipe ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isGeneratingRecipe ? 'Generating...' : 'Generate Recipe'}
          </Button>
          <Button color="inherit" onClick={handleOpen}>
            Add Item
          </Button>
        </Toolbar>
      </AppBar>

  
        <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {!isApiKeySet && (
            <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: 'warning.light' }}>
              <Typography>Warning: OpenAI API key is not set. Image classification will not work.</Typography>
            </Paper>
          )}
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Paper>

          <Grid container spacing={2}>
          {filteredPantry.map(({ id, count }) => (
            <Grid item xs={12} sm={6} md={4} key={id}>
              <Card 
                elevation={3}
                sx={{
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" component="div" gutterBottom>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {count}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', padding: '8px 16px' }}>
                  <IconButton size="small" onClick={() => decreaseItemCount(id)} color="primary">
                    <RemoveIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => increaseItemCount(id)} color="primary">
                    <AddIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => removeItem(id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        </Container>
  
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2" gutterBottom>
            Add New Item
          </Typography>
          <Tabs value={addItemMethod} onChange={(e, newValue) => setAddItemMethod(newValue)} sx={{ mb: 2 }}>
            <Tab label="Text" />
            <Tab label="Camera" />
          </Tabs>
          {addItemMethod === 0 ? (
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Item Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
          ) : (
            <>
              <Camera 
                ref={camera} 
                aspectRatio={1} 
                facingMode={facingMode}
                numberOfCamerasCallback={(cameras) => {
                  console.log('Number of cameras:', cameras);
                }}
              />
              <Button
                fullWidth
                variant="outlined"
                onClick={flipCamera}
                sx={{ mt: 2, mb: 2 }}
              >
                Flip Camera
              </Button>
              {!isApiKeySet && (
                <Typography color="error" sx={{ mt: 1 }}>
                  OpenAI API key is not set. Image classification will not work.
                </Typography>
              )}
            </>
          )}
          <Button
            fullWidth
            variant="contained"
            onClick={handleAddItem}
            disabled={isClassifying || (addItemMethod === 1 && !isApiKeySet)}
            sx={{ mt: 2 }}
          >
            {addItemMethod === 0 ? 'Add Item' : (isClassifying ? 'Classifying...' : 'Capture and Add Item')}
          </Button>
          {errorMessage && (
            <Typography color="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Typography>
          )}
        </Box>
      </Modal>
  
      <Modal
        open={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        aria-labelledby="recipe-modal-title"
        aria-describedby="recipe-modal-description"
      >
        <Box sx={recipemodalStyle}>
          <Typography id="recipe-modal-title" variant="h6" component="h2" gutterBottom>
            Generated Recipe
          </Typography>
          {isGeneratingRecipe ? (
            <CircularProgress />
          ) : errorMessage ? (
            <Typography color="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Typography>
          ) : (
            <StyledMarkdown>
              <ReactMarkdown>{recipe}</ReactMarkdown>
            </StyledMarkdown>
          )}
          <Button
            fullWidth
            variant="contained"
            onClick={() => setRecipeModalOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Modal>
  
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}