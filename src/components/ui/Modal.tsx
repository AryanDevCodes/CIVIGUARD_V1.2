import React, { ReactNode } from "react";
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Remove the problematic import for a non-existent CSS file
// import "@react-dialog/Modal.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent>
        {children}
        <button onClick={onClose}>Close</button>
      </DialogContent>
    </Dialog>
  );
};

export const ModalOverlay = DialogOverlay;
export const ModalContent = DialogContent;
export const ModalHeader = DialogHeader;
export const ModalTitle = DialogTitle;
export const ModalDescription = DialogDescription;
export const ModalFooter = DialogFooter;
export const ModalBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4">{children}</div>
);

export default Modal;
