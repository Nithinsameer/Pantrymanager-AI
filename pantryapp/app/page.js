'use client';
import { Box, Container, Typography, Button, Modal, TextField, AppBar, Toolbar, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Paper, InputAdornment } from '@mui/material';
import { useState, useEffect } from 'react';
import { firestore } from '@/firebase';
import { collection, getDocs, query, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore/lite';

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

export default function Home() {
  const [pantry, setPantry] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemname, setItemname] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPantry, setFilteredPantry] = useState([]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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

  const removeItem = async (item) => {
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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    const filteredItems = pantry.filter((item) =>
      item.id.toLowerCase().includes(event.target.value.toLowerCase())
    );
    setFilteredPantry(filteredItems);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pantry Manager
          </Typography>
          <Button color="inherit" onClick={handleOpen}>
            Add Item
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search items..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Paper>

        <Paper elevation={3} sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List>
            {filteredPantry.map(({ id, count }) => (
              <ListItem key={id} divider>
                <ListItemText
                  primary={id.charAt(0).toUpperCase() + id.slice(1)}
                  secondary={`Quantity: ${count}`}
                />
                <ListItemSecondaryAction>
                  <Button onClick={() => removeItem(id)} color="error">
                    Remove
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
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
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Item Name"
            type="text"
            fullWidth
            variant="outlined"
            value={itemname}
            onChange={(e) => setItemname(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              if (itemname.trim()) {
                addItem(itemname.trim());
                setItemname('');
                handleClose();
              }
            }}
            sx={{ mt: 2 }}
          >
            Add Item
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}