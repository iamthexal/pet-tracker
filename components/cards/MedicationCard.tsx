// components/cards/MedicationCard.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedicalRecord } from "@/types";
import { format, parseISO } from "date-fns";
import { capitalizeFirst } from "@/lib/utils";
import { Pencil, Trash2, Calendar, Clock, User, AlertCircle } from "lucide-react";
import { EditMedicationDialog } from "../dialogs/EditMedicationDialog";
import { useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isDueSoon, isOverdue } from '@/lib/date';

interface MedicationCardProps {
  medication: MedicalRecord;
  onDelete: (id: string) => void;
}

export function MedicationCard({ medication, onDelete }: MedicationCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Updated getStatusBadge function
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        if (!medication.nextDueDate) {
          return <Badge variant="default">Active</Badge>;
        }
        if (isOverdue(medication.nextDueDate)) {
          return <Badge variant="destructive">Overdue</Badge>;
        }
        if (isDueSoon(medication.nextDueDate)) {
          return <Badge variant="warning">Due Soon</Badge>;
        }
        return <Badge variant="default">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'discontinued':
        return <Badge variant="outline">Discontinued</Badge>;
      default:
        return null;
    }
  };

  const renderEndDateInfo = () => {
    if (!medication.endDate) return null;

    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          Ended: {format(parseISO(medication.endDate), 'PPP')}
          {medication.endReason && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-4 w-4 ml-1 inline cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{medication.endReason}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{medication.name}</h3>
                {getStatusBadge(medication.status)}
                <Badge variant="outline">
                  {capitalizeFirst(medication.type)}
                </Badge>
              </div>

              {medication.dosage && (
                <p className="text-sm text-muted-foreground">
                  Dosage: {medication.dosage}
                </p>
              )}

              {medication.frequency && (
                <p className="text-sm text-muted-foreground">
                  Frequency: {medication.frequency}
                </p>
              )}

              {medication.duration && (
                <p className="text-sm text-muted-foreground">
                  Duration: {medication.duration}
                </p>
              )}

              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {format(parseISO(medication.date), 'PPP')}</span>
                </div>

                {medication.status === 'active' && medication.nextDueDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Next Due: {format(parseISO(medication.nextDueDate), 'PPP')}
                    </span>
                  </div>
                )}

                {renderEndDateInfo()}

                {medication.prescribedBy && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Prescribed by: {medication.prescribedBy}</span>
                  </div>
                )}
              </div>

              {medication.notes && (
                <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                  {medication.notes}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Medication</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this medication? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(medication.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditMedicationDialog
        medication={medication}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}