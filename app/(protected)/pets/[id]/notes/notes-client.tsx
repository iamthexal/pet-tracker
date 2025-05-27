// app\(protected)\pets\[id]\notes\notes-client.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Note } from '@/types';
import { formatFirestoreTimestamp } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddNoteDialog } from '@/components/dialogs/AddNoteDialog';
import { EditNoteDialog } from '@/components/dialogs/EditNoteDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';

interface NotesClientProps {
  petId: string;
}

const categoryColors = {
  behavior: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  health: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function NotesClient({ petId }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const verifyPetOwnership = useCallback(async () => {
    if (!user) return false;
    try {
      const petDoc = await getDoc(doc(db, 'pets', petId));
      if (!petDoc.exists() || petDoc.data()?.userId !== user.uid) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Pet not found or access denied.",
        });
        router.push('/dashboard');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error verifying pet ownership:', error);
      return false;
    }
  }, [user, petId, toast, router]);

  useEffect(() => {
    if (!user || !petId) return;

    let unsubscribe: (() => void) | undefined;

    const setupNotes = async () => {
      const hasAccess = await verifyPetOwnership();
      if (!hasAccess) return;

      const notesQuery = query(
        collection(db, 'notes'),
        where('petId', '==', petId),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(
        notesQuery,
        (snapshot) => {
          const notesData: Note[] = [];
          snapshot.forEach((doc) => {
            notesData.push({ id: doc.id, ...doc.data() } as Note);
          });
          setNotes(notesData);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching notes:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load notes. Please try again.",
          });
          setIsLoading(false);
        }
      );
    };

    setupNotes();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [petId, user, toast, verifyPetOwnership]);

  const handleEditClick = useCallback((note: Note) => {
    setSelectedNote(note);
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!user) return;

    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists() || noteDoc.data()?.userId !== user.uid) {
        throw new Error('Unauthorized to delete this note');
      }

      await deleteDoc(noteRef);

      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete note. Please try again.",
      });
    }
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size={32} />
      </div>
    );
  }

  const notesByCategory = {
    all: notes,
    behavior: notes.filter(note => note.category === 'behavior'),
    health: notes.filter(note => note.category === 'health'),
    general: notes.filter(note => note.category === 'general'),
    emergency: notes.filter(note => note.category === 'emergency'),
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-primary">Pet Notes</h1>
          <p className="text-muted-foreground mt-2">
            Keep track of important observations and reminders for your pet
          </p>
        </div>
        <AddNoteDialog petId={petId}>
          <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="mr-2 h-5 w-5" />
            Add Note
          </Button>
        </AddNoteDialog>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-lg">
          {Object.entries(notesByCategory).map(([category, categoryNotes]) => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-4 py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryNotes.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(notesByCategory).map(([category, categoryNotes]) => (
          <TabsContent key={category} value={category}>
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              <AnimatePresence>
                {categoryNotes.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-muted/50 border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-xl font-medium mb-2">No notes in this category</p>
                        <p className="text-sm text-muted-foreground mb-6">
                          Add your first note to keep track of important information
                        </p>
                        <AddNoteDialog petId={petId}>
                          <Button size="lg">
                            <Plus className="mr-2 h-5 w-5" />
                            Add Note
                          </Button>
                        </AddNoteDialog>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  categoryNotes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="mb-4 hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">{note.title}</CardTitle>
                              <CardDescription>
                                {formatFirestoreTimestamp(note.createdAt)}
                              </CardDescription>
                            </div>
                            {note.category && (
                              <Badge className={categoryColors[note.category as keyof typeof categoryColors]}>
                                {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap text-muted-foreground">{note.content}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(note)}
                            className="hover:bg-muted"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="hover:bg-destructive/90"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {selectedNote && (
        <EditNoteDialog
          note={selectedNote}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  );
}