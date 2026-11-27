import './components.css';
import { ComponentRegistry } from '@/runtime';
import {
  ButtonPropsSchema,
  CardPropsSchema,
  ConditionalPropsSchema,
  ImagePropsSchema,
  InputPropsSchema,
  ListPropsSchema,
  StackPropsSchema,
  TextPropsSchema,
} from '@/schema';
import { ButtonNode } from './ButtonNode';
import { CardNode } from './CardNode';
import { ConditionalNode } from './ConditionalNode';
import { ImageNode } from './ImageNode';
import { InputNode } from './InputNode';
import { ListNode } from './ListNode';
import { StackNode } from './StackNode';
import { TextNode } from './TextNode';

/**
 * Creates a fresh ComponentRegistry populated with all 8 core SDUI node types,
 * each paired with its Zod props schema.
 */
export function createDefaultRegistry(): ComponentRegistry {
  return new ComponentRegistry()
    .register({ type: 'Stack', schema: StackPropsSchema, component: StackNode })
    .register({ type: 'Text', schema: TextPropsSchema, component: TextNode })
    .register({ type: 'Button', schema: ButtonPropsSchema, component: ButtonNode })
    .register({ type: 'Image', schema: ImagePropsSchema, component: ImageNode })
    .register({ type: 'Card', schema: CardPropsSchema, component: CardNode })
    .register({ type: 'List', schema: ListPropsSchema, component: ListNode })
    .register({ type: 'Input', schema: InputPropsSchema, component: InputNode })
    .register({ type: 'Conditional', schema: ConditionalPropsSchema, component: ConditionalNode });
}
