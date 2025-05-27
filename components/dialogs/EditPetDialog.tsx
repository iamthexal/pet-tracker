// components/EditPetDialog.tsx

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet } from '@/types';
import { Upload, X } from 'lucide-react';
import { uploadPetImage, deletePetImage } from '@/lib/storage';
import { useAuth } from '@/lib/context/auth-context';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const editPetSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(50),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

type FormData = z.infer<typeof editPetSchema>;

interface EditPetDialogProps {
  pet: Pet;
  children?: React.ReactNode;
  onPetUpdate?: (updatedPet: Partial<Pet>) => void;
}

export function EditPetDialog({ pet, children, onPetUpdate }: EditPetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(pet.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(editPetSchema),
    defaultValues: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      birthDate: pet.birthDate,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 5MB",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update pet information.",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Delete the image from Firebase Storage if it exists
      if (pet.imageUrl) {
        await deletePetImage(pet.imageUrl);
      }

      // Update pet document to remove imageUrl
      const petRef = doc(db, "pets", pet.id);
      await updateDoc(petRef, {
        imageUrl: null,
        updatedAt: serverTimestamp(),
      });

      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Update parent component state
      onPetUpdate?.({ imageUrl: null });

      toast({
        title: "Success",
        description: "Pet image removed successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem removing the image.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update pet information.",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Verify ownership
      const petRef = doc(db, "pets", pet.id);
      const petDoc = await getDoc(petRef);

      if (!petDoc.exists() || petDoc.data()?.userId !== user.uid) {
        throw new Error("Unauthorized to update this pet");
      }

      // Handle image upload if a new image was selected
      const fileInput = fileInputRef.current;
      const imageFile = fileInput?.files?.[0];

      let imageUrl = previewImage;
      if (imageFile) {
        try {
          // Delete old image if it exists
          if (pet.imageUrl) {
            await deletePetImage(pet.imageUrl);
          }
          // Upload new image
          imageUrl = await uploadPetImage(imageFile, user.uid);
        } catch (error) {
          console.error("Error handling image:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update image. Please try again.",
          });
          return;
        }
      }

      const updatedData = {
        ...data,
        imageUrl,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(petRef, updatedData);

      // Update parent component state
      onPetUpdate?.(updatedData);

      toast({
        title: "Success!",
        description: "Pet information updated successfully.",
      });

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating pet:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem updating the pet information.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to delete pets.",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Verify ownership before deletion
      const petRef = doc(db, "pets", pet.id);
      const petDoc = await getDoc(petRef);

      if (!petDoc.exists() || petDoc.data()?.userId !== user.uid) {
        throw new Error("Unauthorized to delete this pet");
      }

      // Delete the image from storage if it exists
      if (pet.imageUrl) {
        await deletePetImage(pet.imageUrl);
      }

      // Delete the pet document
      await deleteDoc(petRef);

      toast({
        title: "Pet Deleted",
        description: "Pet has been successfully removed.",
      });

      setIsDeleteDialogOpen(false);
      setIsOpen(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting pet:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem deleting the pet.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Pet Information</DialogTitle>
          <DialogDescription>
            Update your pet&apos;s information here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                {previewImage ? (
                  <AvatarImage src={previewImage} alt="Preview" />
                ) : (
                  <AvatarFallback>
                    <Upload className="h-8 w-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  id="pet-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  Change Image
                </Button>
                {previewImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter pet&apos;s name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Species</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select species" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="fish">Fish</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="hamster">Hamster</SelectItem>
                      <SelectItem value="guinea pig">Guinea Pig</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter breed (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birth Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isLoading}
                  >
                    Delete Pet
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Deleting your pet&apos;s profile
                      will permanently remove it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isLoading ? (
                        <>
                          <Loading size={16} className="mr-2" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loading size={16} className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
