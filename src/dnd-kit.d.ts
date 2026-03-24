declare module "@dnd-kit/core" {
  import { ReactNode } from "react";
  
  export interface DragEndEvent {
    active: { id: string | number; data?: any };
    over: { id: string | number; data?: any } | null;
  }

  export interface DragStartEvent {
    active: { id: string | number; data?: any };
  }

  export interface SensorDescriptor<T = any> {
    sensor: any;
    options?: T;
  }

  export function useSensor(sensor: any, options?: any): SensorDescriptor;
  export function useSensors(...sensors: SensorDescriptor[]): SensorDescriptor[];
  export const PointerSensor: any;
  export const KeyboardSensor: any;
  export function closestCorners(args: any): any;
  export function closestCenter(args: any): any;

  export function useDroppable(options: { id: string | number; data?: any }): {
    setNodeRef: (element: HTMLElement | null) => void;
    isOver: boolean;
    active: any;
    over: any;
  };

  export function DndContext(props: {
    sensors?: SensorDescriptor[];
    collisionDetection?: any;
    onDragEnd?: (event: DragEndEvent) => void;
    onDragStart?: (event: DragStartEvent) => void;
    onDragOver?: (event: any) => void;
    children: ReactNode;
  }): JSX.Element;
}

declare module "@dnd-kit/sortable" {
  export function useSortable(options: { id: string | number; data?: any }): {
    attributes: Record<string, any>;
    listeners: Record<string, any> | undefined;
    setNodeRef: (element: HTMLElement | null) => void;
    transform: { x: number; y: number; scaleX: number; scaleY: number } | null;
    transition: string | undefined;
    isDragging: boolean;
  };

  export function SortableContext(props: {
    items: (string | number)[];
    strategy?: any;
    children: any;
  }): JSX.Element;

  export function verticalListSortingStrategy(args: any): any;
  export function horizontalListSortingStrategy(args: any): any;
}

declare module "@dnd-kit/utilities" {
  export const CSS: {
    Transform: {
      toString(transform: { x: number; y: number; scaleX: number; scaleY: number } | null): string | undefined;
    };
    Transition: {
      toString(args: any): string | undefined;
    };
  };
}
