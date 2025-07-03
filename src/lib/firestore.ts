import { db } from '../lib/firebase'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { 
  ChatSession, 
  SessionMetadata, 
  ProjectCardState, 
  Message,
  ProjectSummary,
  ProjectEstimates,
  ResearchHighlights
} from '../types/chat'

// Створення нової сесії чату
export async function createChatSession(
  userName: string, 
  userEmail: string
): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const metadata: SessionMetadata = {
    sessionId,
    userId: userEmail, // Використовуємо email як userId
    userName,
    userEmail,
    status: 'active',
    startedAt: new Date(),
    totalMessages: 0,
    lastActivity: new Date(),
  }

  const projectCard: ProjectCardState = {
    workerStatus: {
      summarizer: 'idle',
      estimator: 'idle',
      researcher: 'idle',
    }
  }

  const chatSession: Omit<ChatSession, 'id'> = {
    metadata,
    messages: [],
    projectCard,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const docRef = await addDoc(collection(db, 'chatSessions'), chatSession)
  return docRef.id
}

// Отримання сесії за ID
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const docRef = doc(db, 'chatSessions', sessionId)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ChatSession
  }
  return null
}

// Оновлення сесії в реальному часі
export function subscribeToSession(sessionId: string, callback: (session: ChatSession | null) => void) {
  const docRef = doc(db, 'chatSessions', sessionId)
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as ChatSession)
    } else {
      callback(null)
    }
  })
}

// Додавання повідомлення до сесії
export async function addMessageToSession(sessionId: string, message: Omit<Message, 'id'>) {
  const session = await getChatSession(sessionId)
  if (!session) throw new Error('Session not found')

  const newMessage: Message = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }

  const updatedMessages = [...session.messages, newMessage]
  
  await updateDoc(doc(db, 'chatSessions', sessionId), {
    messages: updatedMessages,
    'metadata.totalMessages': updatedMessages.length,
    'metadata.lastActivity': new Date(),
    updatedAt: new Date(),
  })

  return newMessage
}

// Оновлення стану картки проєкту
export async function updateProjectCard(sessionId: string, updates: Partial<ProjectCardState>) {
  const session = await getChatSession(sessionId)
  if (!session) throw new Error('Session not found')

  const updatedProjectCard = { ...session.projectCard, ...updates }
  
  await updateDoc(doc(db, 'chatSessions', sessionId), {
    projectCard: updatedProjectCard,
    updatedAt: new Date(),
  })
}

// Оновлення статусу воркера
export async function updateWorkerStatus(
  sessionId: string, 
  worker: 'summarizer' | 'estimator' | 'researcher', 
  status: 'idle' | 'running' | 'completed' | 'error'
) {
  await updateDoc(doc(db, 'chatSessions', sessionId), {
    [`projectCard.workerStatus.${worker}`]: status,
    updatedAt: new Date(),
  })
}

// Збереження результатів воркерів
export async function saveWorkerResults(
  sessionId: string,
  worker: 'summarizer' | 'estimator' | 'researcher',
  results: ProjectSummary | ProjectEstimates | ResearchHighlights[]
) {
  const updateData: any = {
    updatedAt: new Date(),
  }

  switch (worker) {
    case 'summarizer':
      updateData['projectCard.summary'] = results as ProjectSummary
      break
    case 'estimator':
      updateData['projectCard.estimates'] = results as ProjectEstimates
      break
    case 'researcher':
      updateData['projectCard.research'] = results as ResearchHighlights[]
      break
  }

  await updateDoc(doc(db, 'chatSessions', sessionId), updateData)
}

// Завершення сесії
export async function completeSession(sessionId: string) {
  await updateDoc(doc(db, 'chatSessions', sessionId), {
    'metadata.status': 'completed',
    'metadata.completedAt': new Date(),
    updatedAt: new Date(),
  })
}

// Отримання всіх сесій користувача
export async function getUserSessions(userEmail: string) {
  const q = query(
    collection(db, 'chatSessions'),
    where('metadata.userEmail', '==', userEmail),
    orderBy('metadata.startedAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatSession[]
}

// Старі функції (залишаємо для зворотної сумісності)
export async function saveChat(projectId: string, message: any) {
  await addDoc(collection(db, 'messages'), {
    ...message,
    projectId,
    createdAt: serverTimestamp(),
  })
}

export async function createProject(userId: string, data: any) {
  const doc = await addDoc(collection(db, 'projects'), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  })
  return doc.id
}

export async function getProjects() {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
} 