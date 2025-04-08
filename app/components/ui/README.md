# UI Component Library

This directory contains reusable UI components designed to maintain consistency across the application while reducing code duplication.

## Installation

All required dependencies for this component library are already included in the main package.json.

## Available Components

### Button
A customizable button component with various styles, sizes, and states.

```tsx
import { Button } from '@/app/components/ui';

<Button 
  variant="primary" 
  size="md" 
  isLoading={false}
  isFullWidth={false}
  onClick={() => alert('Clicked!')}
>
  Click me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'link'
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `isLoading`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `isFullWidth`: boolean

### FormField
A form input field component with error handling and integration with react-hook-form.

```tsx
import { FormField } from '@/app/components/ui';
import { useForm } from 'react-hook-form';

const { register, formState: { errors } } = useForm();

<FormField
  id="email"
  label="Email Address"
  register={register}
  error={errors.email}
  helpText="We'll never share your email."
  type="email"
  placeholder="Enter email"
/>
```

**Props:**
- `id`: string
- `label`: string (optional)
- `register`: UseFormRegister<any>
- `error`: FieldError (optional)
- `helpText`: string (optional)
- Plus all standard HTML input attributes

### TextArea
A textarea component with error handling and integration with react-hook-form.

```tsx
import { TextArea } from '@/app/components/ui';
import { useForm } from 'react-hook-form';

const { register, formState: { errors } } = useForm();

<TextArea
  id="message"
  label="Your Message"
  register={register}
  error={errors.message}
  rows={4}
  placeholder="Enter your message"
/>
```

**Props:**
- `id`: string
- `label`: string (optional)
- `register`: UseFormRegister<any>
- `error`: FieldError (optional)
- `helpText`: string (optional)
- `rows`: number (default: 4)
- Plus all standard HTML textarea attributes

### Card
A versatile card component with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui';

<Card variant="default" padding="md" isHoverable>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

**Props:**
- `variant`: 'default' | 'elevated' | 'flat' | 'outline' | 'ghost'
- `padding`: 'none' | 'xs' | 'sm' | 'md' | 'lg'
- `isHoverable`: boolean

### Badge
A badge component for displaying status, counts, or labels.

```tsx
import { Badge } from '@/app/components/ui';

<Badge variant="primary" size="md" removable onRemove={() => console.log('Removed')}>
  New
</Badge>
```

**Props:**
- `variant`: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
- `size`: 'xs' | 'sm' | 'md' | 'lg'
- `removable`: boolean
- `onRemove`: () => void

### Skeleton
Loading skeleton components for various UI elements.

```tsx
import { Skeleton, TextSkeleton, AvatarSkeleton, CardSkeleton } from '@/app/components/ui';

// Basic skeleton
<Skeleton className="h-10 w-full" />

// Text skeleton with multiple lines
<TextSkeleton lines={3} />

// Avatar skeleton
<AvatarSkeleton size="md" />

// Card skeleton
<CardSkeleton />
```

### Modal
A modal dialog component with customizable behavior.

```tsx
import { Modal, Button } from '@/app/components/ui';
import { useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

<>
  <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
  
  <Modal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Modal Title"
    size="md"
    footer={
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button variant="primary" onClick={() => setIsOpen(false)}>Save</Button>
      </div>
    }
  >
    Modal content goes here
  </Modal>
</>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string (optional)
- `footer`: ReactNode (optional)
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closeOnOverlayClick`: boolean (default: true)
- `closeOnEsc`: boolean (default: true)

### Tooltip
A tooltip component that shows additional information on hover.

```tsx
import { Tooltip, Button } from '@/app/components/ui';

<Tooltip content="This is a tooltip" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

**Props:**
- `content`: ReactNode
- `position`: 'top' | 'right' | 'bottom' | 'left'
- `delay`: number (default: 300)
- `maxWidth`: string (default: '200px')
- `closeOnClick`: boolean (default: false)

### TabGroup
A component for switching between different content sections.

```tsx
import { TabGroup } from '@/app/components/ui';

<TabGroup
  tabs={[
    {
      id: 'tab1',
      label: 'First Tab',
      content: <div>Content for first tab</div>,
    },
    {
      id: 'tab2',
      label: 'Second Tab',
      content: <div>Content for second tab</div>,
    },
  ]}
  defaultActiveTab="tab1"
  variant="underline"
  onChange={(tabId) => console.log(`Switched to tab: ${tabId}`)}
/>
```

**Props:**
- `tabs`: Array of tab items (id, label, content, disabled)
- `defaultActiveTab`: string
- `variant`: 'underline' | 'pills' | 'buttons'
- `onChange`: (tabId: string) => void

### Alert
An alert component for displaying info, success, warning, or error messages.

```tsx
import { Alert } from '@/app/components/ui';
import { useState } from 'react';

const [isVisible, setIsVisible] = useState(true);

{isVisible && (
  <Alert 
    variant="success"
    title="Success!"
    dismissible
    onDismiss={() => setIsVisible(false)}
  >
    Your action was completed successfully.
  </Alert>
)}
```

**Props:**
- `variant`: 'info' | 'success' | 'warning' | 'error'
- `title`: string (optional)
- `dismissible`: boolean
- `onDismiss`: () => void
- `icon`: ReactNode (optional, overrides default icon)

### Select
A select dropdown component with form integration.

```tsx
import { Select } from '@/app/components/ui';
import { useForm } from 'react-hook-form';

const { register, formState: { errors } } = useForm();

<Select
  id="country"
  label="Country"
  register={register}
  error={errors.country}
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ]}
/>
```

**Props:**
- `id`: string
- `label`: string (optional)
- `options`: Array of { value, label, disabled }
- `register`: UseFormRegister<any>
- `error`: FieldError (optional)
- `size`: 'sm' | 'md' | 'lg'

### SearchableSelect
A select component with search functionality.

```tsx
import { SearchableSelect } from '@/app/components/ui';
import { useState } from 'react';

const [value, setValue] = useState('');

<SearchableSelect
  id="country"
  label="Country"
  value={value}
  onChange={setValue}
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ]}
/>
```

**Props:**
- Same as Select, except uses `value` and `onChange` instead of `register`

## Utility Functions

### cn
A utility function for conditionally joining class names.

```tsx
import { cn } from '@/app/utils/cn';

<div className={cn(
  'base-class', 
  condition && 'conditional-class',
  { 'object-based-class': anotherCondition }
)}>
  Content
</div>
``` 