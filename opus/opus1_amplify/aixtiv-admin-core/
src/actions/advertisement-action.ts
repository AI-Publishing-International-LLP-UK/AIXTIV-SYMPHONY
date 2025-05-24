interface Advertisement {
  id?: string;
  url: string;
  backgroundImg: string;
  title: string;
  description: string;
  isHeroSection?: boolean;
  isFooterBanner?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type createAdvertisementDTO = {
  url: string;
  backgroundImg: string;
  title: string;
  description: string;
}
export const getAllAdvertisememts = async () => {
  try {
    const querySnapshot = await getDocs(advertisementCollection);
    const advertisements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Advertisement[];

    return advertisements;
  } catch (err) {
    console.error('Error getting advertisements:', err);
    throw new Error('Failed to get advertisements');
  }
}
export const createAdvertisement = async (data: createAdvertisementDTO) => {
  try {
    const newAdvertisementData = {
      ...data,
      isHeroSection: false,
      isFooterBanner: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(advertisementCollection, newAdvertisementData);
    const newAdvertisement = {
      id: docRef.id,
      ...newAdvertisementData
    };

    return newAdvertisement;
  } catch (err) {
    console.error('Error creating advertisement:', err);
    throw new Error('Failed to create advertisement');
  }
}
export const updateAdvertisement = async (id: string, data: Partial<Advertisement>) => {
  try {
    const advertisementRef = doc(db, 'advertisements', id);
    const advertisementSnapshot = await getDoc(advertisementRef);

    if (!advertisementSnapshot.exists()) {
      throw new Error(`Advertisement with ID ${id} not found`);
    }

    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    await updateDoc(advertisementRef, updateData);

    const updatedSnapshot = await getDoc(advertisementRef);
    const updatedAdvertisement = {
      id: updatedSnapshot.id,
      ...updatedSnapshot.data()
    } as Advertisement;

    return updatedAdvertisement;
  } catch (err) {
    console.error('Error updating advertisement:', err);
    throw new Error('Failed to update advertisement');
  }
}
export const getAdvertisementById = async (id: string) => {
  try {
    const advertisementRef = doc(db, 'advertisements', id);
    const advertisementSnapshot = await getDoc(advertisementRef);

    if (!advertisementSnapshot.exists()) {
      return null;
    }

    const advertisement = {
      id: advertisementSnapshot.id,
      ...advertisementSnapshot.data()
    } as Advertisement;

    return advertisement;
  } catch (err) {
    console.error('Error getting advertisement by ID:', err);
    throw new Error('Failed to get advertisement by id');
  }
}
export const deleteAdvertisement = async (id: string) => {
  try {
    const advertisementRef = doc(db, 'advertisements', id);
    const advertisementSnapshot = await getDoc(advertisementRef);

    if (!advertisementSnapshot.exists()) {
      throw new Error(`Advertisement with ID ${id} not found`);
    }

    const deletedAdvertisement = {
      id: advertisementSnapshot.id,
      ...advertisementSnapshot.data()
    };

    await deleteDoc(advertisementRef);

    return deletedAdvertisement;
  } catch (err) {
    console.error('Error deleting advertisement:', err);
    throw new Error('Failed to delete advertisement');
  }
}
export const setAsHeader = async (id: string) => {
  try {
    const batch = writeBatch(db);
    
    // Find all advertisements that are currently set as hero section
    const heroSectionQuery = query(
      advertisementCollection, 
      where('isHeroSection', '==', true)
    );
    
    const heroSectionSnapshot = await getDocs(heroSectionQuery);
    
    // Update all current hero sections to false
    heroSectionSnapshot.forEach(doc => {
      batch.update(doc.ref, { isHeroSection: false, updatedAt: new Date() });
    });
    
    // Set the selected advertisement as hero section
    const advertisementRef = doc(db, 'advertisements', id);
    batch.update(advertisementRef, { 
      isHeroSection: true,
      updatedAt: new Date()
    });
    
    // Commit the batch
    await batch.commit();
  } catch (err) {
    console.error('Error setting advertisement as header:', err);
    throw new Error('Failed to set advertisement as header');
  }
}
export const unsetHeader = async (id: string) => {
  try {
    const advertisementRef = doc(db, 'advertisements', id);
    await updateDoc(advertisementRef, { 
      isHeroSection: false,
      updatedAt: new Date()
    });
  } catch (err) {
    console.error('Error unsetting advertisement as header:', err);
    throw new Error('Failed to unset advertisement as header');
  }
}
export const setAsFooter = async (id: string) => {
  try {
    const batch = writeBatch(db);
    
    // Find all advertisements that are currently set as footer banner
    const footerBannerQuery = query(
      advertisementCollection, 
      where('isFooterBanner', '==', true)
    );
    
    const footerBannerSnapshot = await getDocs(footerBannerQuery);
    
    // Update all current footer banners to false
    footerBannerSnapshot.forEach(doc => {
      batch.update(doc.ref, { isFooterBanner: false, updatedAt: new Date() });
    });
    
    // Set the selected advertisement as footer banner
    const advertisementRef = doc(db, 'advertisements', id);
    batch.update(advertisementRef, { 
      isFooterBanner: true,
      updatedAt: new Date()
    });
    
    // Commit the batch
    await batch.commit();
  } catch (err) {
    console.error('Error setting advertisement as footer:', err);
    throw new Error('Failed to set advertisement as footer');
  }
}
export const unsetFooter = async (id: string) => {
  try {
    const advertisementRef = doc(db, 'advertisements', id);
    await updateDoc(advertisementRef, { 
      isFooterBanner: false,
      updatedAt: new Date()
    });
  } catch (err) {
    console.error('Error unsetting advertisement as footer:', err);
    throw new Error('Failed to unset advertisement as footer');
  }
}
