# NitroDash Core Component Library

This document outlines the reusable UI components developed for the NitroDash Racing App. Use these components to maintain high visual fidelity and consistent performance across all pages.

## 🚀 Base Components

### `Button`
High-octane buttons with multiple racing variants.
```tsx
import { Button } from '../components/ui/core';

<Button variant="primary" size="lg" isLoading={false}>Burn Rubber</Button>
<Button variant="secondary">View Garage</Button>
<Button variant="ghost" size="sm">Details</Button>
```

### `Card`
The standard container for all interactive blocks. Features built-in glassmorphism and hover transitions.
```tsx
import { Card } from '../components/ui/core';

<Card glass={true} hover={true}>
  <h3>Circuit Name</h3>
</Card>
```

### `Input`
Stylized text fields with support for validation and icons.
```tsx
import { Input } from '../components/ui/core';
import { Mail } from 'lucide-react';

<Input 
  label="Email" 
  icon={<Mail />} 
  error="Invalid email" 
  placeholder="driver@nitro.com" 
/>
```

## 🛠️ Specialized Racing Components

### `StatsProgress`
Displays car performance metrics (Speed, Handling, etc.) with support for "potential" boosts from equipment.
```tsx
import { StatsProgress } from '../components/ui/core';

<StatsProgress 
  label="Acceleration" 
  value={75} 
  potential={10} 
  max={100} 
/>
```

### `Tabs`
A sleek, segmented control for switching views (e.g., Garage vs Parts).
```tsx
import { Tabs } from '../components/ui/core';

<Tabs 
  activeTab={currentTab} 
  onTabChange={setTab} 
  options={[
    { id: 'cars', label: 'My Cars', icon: <CarIcon /> },
    { id: 'parts', label: 'Inventory' }
  ]} 
/>
```

### `Modal`
Global overlay for critical confirmations or detailed stats.
```tsx
import { Modal } from '../components/ui/core';

<Modal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)} 
  title="Equip V8 Engine"
>
  <p>Confirm equipment install?</p>
</Modal>
```

### `Skeleton`
Animated placeholders for better perceived performance during loading.
```tsx
<Skeleton className="h-40 w-full" />
```

## 📐 Layout Utilities

### `PageContainer`
Standard wrapper for all top-level pages. Handles standard padding and the shared Navbar.
```tsx
import PageContainer from '../components/PageContainer';

const MyPage = () => (
  <PageContainer className="space-y-8">
     {/* Page Content */}
  </PageContainer>
);
```

### `cn` Utility
Helper function to merge Tailwind classes safely, handling conflicts between base styles and overrides.
```tsx
import { cn } from '../components/ui/core';

<div className={cn("base-class", isRed && "text-red-500", customClass)}>...</div>
```
