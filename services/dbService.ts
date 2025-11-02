import { db } from '../firebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
    serverTimestamp,
    orderBy,
    limit as firestoreLimit,
    Timestamp,
    onSnapshot,
    runTransaction,
    writeBatch
} from 'firebase/firestore';
import { Crop, Order, OrderStatus, User, UserRole, AugmentedOrder, Chat, ChatMessage, Notification } from '../types';

// --- DATA CONVERTER HELPER ---
const convertTimestamps = (data: any): any => {
    if (data === null || typeof data !== 'object') {
        return data;
    }

    if (data instanceof Timestamp) {
        return data.toDate();
    }

    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    
    // FIX: Only recurse on plain objects to avoid iterating over Firebase's internal complex objects.
    if (data.constructor === Object) {
        const convertedData: { [key: string]: any } = {};
        for (const key in data) {
            convertedData[key] = convertTimestamps(data[key]);
        }
        return convertedData;
    }

    return data;
};

const fromFirestore = <T,>(doc: any): T => {
    const data = doc.data();
    const convertedData = convertTimestamps(data);
    return { ...convertedData, id: doc.id } as T;
};


// User Service
export const getUserById = async (id: string): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, 'users', id));
    return userDoc.exists() ? fromFirestore<User>(userDoc) : null;
};


// Crop Service
export const getCrops = async (options?: { limit?: number, category?: string }): Promise<Crop[]> => {
    const constraints = [where('status', '==', 'available'), orderBy('timestamp', 'desc')];
    if (options?.limit) {
        constraints.push(firestoreLimit(options.limit));
    }
    if (options?.category) {
        constraints.push(where('category', '==', options.category));
    }
    const q = query(collection(db, 'crops'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<Crop>(doc));
};

export const getCropById = async (id: string): Promise<Crop | undefined> => {
    const cropDoc = await getDoc(doc(db, 'crops', id));
    return cropDoc.exists() ? fromFirestore<Crop>(cropDoc) : undefined;
};

export const getCropsByFarmer = async (farmerId: string): Promise<Crop[]> => {
    const q = query(collection(db, 'crops'), where('farmerId', '==', farmerId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<Crop>(doc));
};

export const addCrop = async (cropData: Omit<Crop, 'id' | 'timestamp'>): Promise<void> => {
    await addDoc(collection(db, 'crops'), {
        ...cropData,
        timestamp: serverTimestamp(),
    });
};

export const updateCrop = async (cropId: string, updates: Partial<Omit<Crop, 'id' | 'timestamp'>>): Promise<void> => {
    const cropRef = doc(db, 'crops', cropId);
    await updateDoc(cropRef, updates);
};

export const deleteCrop = async (cropId: string): Promise<void> => {
    await deleteDoc(doc(db, 'crops', cropId));
};


// Order Service
export const placeOrder = async (orderData: Omit<Order, 'id' | 'status' | 'timestamp'>, buyerName: string): Promise<void> => {
    const newOrderRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: OrderStatus.PENDING,
        timestamp: serverTimestamp(),
    });
    
    // Create notification for farmer
    await createNotification({
        userId: orderData.farmerId,
        message: `notification.newOrder`,
        messageParams: { cropName: orderData.cropName, buyerName: buyerName },
        link: '/orders',
    });
};

export const updateOrderStatus = async (order: Order, status: OrderStatus): Promise<void> => {
    await updateDoc(doc(db, 'orders', order.id), { status });
    
    // Create notification for buyer
    let messageKey = '';
    if (status === OrderStatus.ACCEPTED) messageKey = 'notification.orderAccepted';
    if (status === OrderStatus.REJECTED) messageKey = 'notification.orderRejected';

    if (messageKey) {
        await createNotification({
            userId: order.buyerId,
            message: messageKey,
            messageParams: { cropName: order.cropName },
            link: '/orders',
        });
    }
};

export const completeOrder = async (order: AugmentedOrder) => {
    const orderRef = doc(db, 'orders', order.id);
    
    return runTransaction(db, async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw "Order does not exist!";

        const orderData = orderDoc.data() as Omit<Order, 'timestamp'> & { timestamp: Timestamp };
        if (orderData.status !== OrderStatus.ACCEPTED) throw "Order must be accepted first.";
        
        const cropRef = doc(db, 'crops', orderData.cropId);
        const cropDoc = await transaction.get(cropRef);
        if (!cropDoc.exists()) throw "Associated crop does not exist!";

        const cropData = cropDoc.data() as Omit<Crop, 'timestamp'> & { timestamp: Timestamp };
        const newQuantity = cropData.quantity - orderData.quantity;
        if (newQuantity < 0) throw "Not enough stock.";
        
        transaction.update(cropRef, { quantity: newQuantity });
        if (newQuantity === 0) {
            transaction.update(cropRef, { status: 'sold' });
        }
        transaction.update(orderRef, { status: OrderStatus.COMPLETED });

    }).then(async () => {
         // Create notification for buyer after transaction succeeds
        await createNotification({
            userId: order.buyerId,
            message: 'notification.orderCompleted',
            messageParams: { cropName: order.cropName },
            link: '/orders',
        });
    });
};


export const getOrdersForUser = async (userId: string, role: UserRole): Promise<AugmentedOrder[]> => {
    const field = role === UserRole.BUYER ? 'buyerId' : 'farmerId';
    const q = query(collection(db, 'orders'), where(field, '==', userId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => fromFirestore<Order>(doc));

    return Promise.all(orders.map(async order => {
        const [buyer, farmer, crop] = await Promise.all([
            getUserById(order.buyerId),
            getUserById(order.farmerId),
            getCropById(order.cropId)
        ]);
        
        return {
            ...order,
            cropName: crop?.cropName || order.cropName || 'Unknown Crop',
            buyerName: buyer?.name || 'Unknown Buyer',
            farmerName: farmer?.name || 'Unknown Farmer',
            totalPrice: order.totalPrice ?? (crop ? crop.price * order.quantity : 0),
        };
    }));
};

// Real-time Listeners for Dashboard
export const listenForFarmerCrops = (farmerId: string, callback: (crops: Crop[]) => void) => {
    const q = query(collection(db, 'crops'), where('farmerId', '==', farmerId), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => fromFirestore<Crop>(doc))));
};

export const listenForFarmerOrders = (farmerId: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, 'orders'), where('farmerId', '==', farmerId), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => fromFirestore<Order>(doc))));
};


// Chat Service
export const getOrCreateChat = async (currentUserUid: string, otherUserUid: string): Promise<string> => {
    const participants = [currentUserUid, otherUserUid].sort();
    const q = query(collection(db, 'chats'), where('participants', '==', participants));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    } else {
        const [currentUser, otherUser] = await Promise.all([
            getUserById(currentUserUid),
            getUserById(otherUserUid)
        ]);
        const newChat = await addDoc(collection(db, 'chats'), {
            participants,
            participantInfo: {
                [currentUserUid]: { name: currentUser?.name || 'User' },
                [otherUserUid]: { name: otherUser?.name || 'User' },
            },
            lastMessage: null,
        });
        return newChat.id;
    }
};

export const listenForChats = (userId: string, callback: (chats: Chat[]) => void) => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId), orderBy('lastMessage.timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => fromFirestore<Chat>(doc))));
};

export const listenForMessages = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(doc => fromFirestore<ChatMessage>(doc))));
};

export const sendMessage = async (chatId: string, senderId: string, text: string, senderName: string, recipientId: string) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const chatRef = doc(db, 'chats', chatId);

    const messageData = { senderId, text, timestamp: serverTimestamp() };
    await addDoc(messagesRef, messageData);
    await updateDoc(chatRef, { lastMessage: messageData });
    
    // Create notification for recipient
    await createNotification({
        userId: recipientId,
        message: 'notification.newMessage',
        messageParams: { senderName },
        link: '/messages',
    });
};

// Notification Service
export const createNotification = async (
    notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'userId'> & { userId: string, messageParams?: Record<string, string> }
) => {
    const notificationRef = collection(db, 'users', notificationData.userId, 'notifications');
    await addDoc(notificationRef, {
        ...notificationData,
        isRead: false,
        timestamp: serverTimestamp(),
    });
};

export const listenForNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'), firestoreLimit(3));
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => fromFirestore<Notification>(doc));
        callback(notifications);
    });
};

export const getAllNotificationsForUser = async (userId: string): Promise<Notification[]> => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<Notification>(doc));
};

export const markNotificationsAsRead = async (userId: string, notificationIds: string[]) => {
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
        const notifRef = doc(db, 'users', userId, 'notifications', id);
        batch.update(notifRef, { isRead: true });
    });
    await batch.commit();
};