'use client';
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { firestore } from '@/firebase';
import { collection, getDocs, query, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore/lite';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [pantry, setPantry] = useState([]);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [itemname, setItemname] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPantry, setFilteredPantry] = useState([]);

  const updatePantry = async () => {
    const snapshot = query(collection(firestore, 'pantry'));
    const pantrylist = [];
    const docs = await getDocs(snapshot);
    docs.forEach((doc) => {
      pantrylist.push({ name: doc.id, ...doc.data() });
    });
    console.log(pantrylist);
    setPantry(pantrylist);
    setFilteredPantry(pantrylist); // Initialize filtered list
  };

  useEffect(() => {
    updatePantry();
  }, []);

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const {count} = docSnap.data()
      await setDoc(docRef, { count: count + 1 });
    } else {
      await setDoc(docRef, { count: 1 });
    }
    // console.log(docSnap.data());
    // await setDoc(docRef, { count: 1 });
    await updatePantry();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const {count} = docSnap.data()
      if (count > 1) {
        await setDoc(docRef, { count: count - 1 });
      } else {
        await deleteDoc(docRef);
      }
    }
    // await deleteDoc(docRef);
    await updatePantry();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    const filteredItems = pantry.filter((item) =>
      item.name.toLowerCase().includes(event.target.value.toLowerCase())
    );
    setFilteredPantry(filteredItems);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemname}
              onChange={(e) => setItemname(e.target.value)}
            ></TextField>
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemname);
                setItemname('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button variant="contained" onClick={handleOpen}>
        Add
      </Button>
      <TextField
        id="search-bar"
        label="Search Items"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={handleSearchChange}
        style={{ marginBottom: '16px' }}
      />
      <Box border="1px solid #333">
        <Box
          width="800px"
          height="100px"
          bgcolor="#ADD8E6"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant="h2" color="#333" textAlign="center">
            Pantry Items
          </Typography>
        </Box>
        <Stack width="800px" height="250px" spacing={2} overflow="scroll">
          {filteredPantry.map(({ name, count }) => (
            <Box
              key={name}
              width="100%"
              minHeight="100px"
              display="flex"
              justifyContent="space-between"
              paddingX={5}
              alignItems="center"
              bgcolor="#f0f0f0"
            >
              <Typography variant="h3" color="#333" textAlign="center">
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h3" color="#333" textAlign="center">
                Quantity: {count}
              </Typography>
              <Button variant="contained" color="error" onClick={() => removeItem(name)}>
                X
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
