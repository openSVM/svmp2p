# Frontend Component Documentation

## Overview
This document provides detailed information about the frontend components in the SVMP2P platform. It covers component structure, props, state management, and usage examples.

## Table of Contents
- [Component Architecture](#component-architecture)
- [Core Components](#core-components)
- [Common Components](#common-components)
- [Guided Workflow Components](#guided-workflow-components)
- [Profile Components](#profile-components)
- [Notification Components](#notification-components)
- [State Management](#state-management)
- [Styling System](#styling-system)
- [Testing Components](#testing-components)

## Component Architecture

The SVMP2P frontend follows a modular component architecture with the following principles:

1. **Component Hierarchy**: Components are organized in a hierarchical structure
2. **Reusability**: Common UI elements are abstracted into reusable components
3. **Separation of Concerns**: Components are focused on specific functionality
4. **Prop Drilling Minimization**: Context API is used to avoid excessive prop drilling
5. **Responsive Design**: All components adapt to different screen sizes

The component directory structure is organized as follows:

```
src/
├── components/
│   ├── common/             # Reusable UI components
│   ├── guided-workflow/    # Step-by-step workflow components
│   ├── notifications/      # Notification system components
│   ├── profile/            # User profile components
│   ├── DisputeResolution.js
│   ├── OfferCreation.js
│   ├── OfferList.js
│   └── UserProfile.js
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── styles/                 # CSS and styling files
└── utils/                  # Utility functions
```

## Core Components

### OfferCreation

The `OfferCreation` component allows users to create new trading offers.

**Props:**
- `onSubmit`: Function to handle form submission
- `initialValues`: Initial form values (optional)
- `isLoading`: Boolean to indicate loading state

**State:**
- Form field values
- Validation errors
- Submission status

**Example Usage:**
```jsx
import OfferCreation from './components/OfferCreation';

function CreateOfferPage() {
  const handleSubmit = async (values) => {
    // Handle submission logic
  };

  return (
    <OfferCreation
      onSubmit={handleSubmit}
      initialValues={{
        assetType: 'SOL',
        amount: '',
        price: '',
        paymentMethods: [],
        terms: ''
      }}
      isLoading={false}
    />
  );
}
```

### OfferList

The `OfferList` component displays available offers with filtering and sorting options.

**Props:**
- `offers`: Array of offer objects
- `onOfferSelect`: Function to handle offer selection
- `isLoading`: Boolean to indicate loading state
- `filters`: Object containing filter criteria (optional)

**State:**
- Active filters
- Sort order
- Pagination state

**Example Usage:**
```jsx
import OfferList from './components/OfferList';

function OffersPage() {
  const [selectedOffer, setSelectedOffer] = useState(null);
  
  return (
    <OfferList
      offers={offersData}
      onOfferSelect={setSelectedOffer}
      isLoading={isLoadingOffers}
      filters={{
        assetType: 'SOL',
        minAmount: 0.1,
        maxAmount: 10
      }}
    />
  );
}
```

### DisputeResolution

The `DisputeResolution` component provides an interface for handling trade disputes.

**Props:**
- `tradeId`: ID of the trade in dispute
- `onResolve`: Function to handle dispute resolution
- `onCancel`: Function to handle cancellation

**State:**
- Dispute details
- Evidence uploads
- Resolution status

**Example Usage:**
```jsx
import DisputeResolution from './components/DisputeResolution';

function DisputePage() {
  const handleResolve = async (resolution) => {
    // Handle resolution logic
  };
  
  return (
    <DisputeResolution
      tradeId="trade123"
      onResolve={handleResolve}
      onCancel={() => navigate('/trades')}
    />
  );
}
```

### UserProfile

The `UserProfile` component displays user information, reputation, and transaction history.

**Props:**
- `userId`: ID of the user to display
- `isCurrentUser`: Boolean indicating if profile belongs to current user

**State:**
- Active tab
- Profile data loading state
- Edit mode (for current user)

**Example Usage:**
```jsx
import UserProfile from './components/UserProfile';

function ProfilePage() {
  const { userId } = useParams();
  const currentUserId = useCurrentUser().id;
  
  return (
    <UserProfile
      userId={userId}
      isCurrentUser={userId === currentUserId}
    />
  );
}
```

## Common Components

### LoadingSpinner

A reusable loading indicator with customizable size and color.

**Props:**
- `size`: Size of the spinner ('small', 'medium', 'large')
- `color`: Color of the spinner
- `text`: Optional loading text

**Example Usage:**
```jsx
import { LoadingSpinner } from './components/common';

function LoadingPage() {
  return (
    <div className="loading-container">
      <LoadingSpinner size="large" color="primary" text="Loading data..." />
    </div>
  );
}
```

### ButtonLoader

A button with integrated loading state.

**Props:**
- `isLoading`: Boolean to indicate loading state
- `disabled`: Boolean to disable the button
- `onClick`: Click handler function
- `children`: Button content

**Example Usage:**
```jsx
import { ButtonLoader } from './components/common';

function SubmitForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Submit logic
    setIsSubmitting(false);
  };
  
  return (
    <ButtonLoader
      isLoading={isSubmitting}
      disabled={!formIsValid}
      onClick={handleSubmit}
    >
      Submit
    </ButtonLoader>
  );
}
```

### TransactionStatus

A toast-like notification for transaction status updates.

**Props:**
- `status`: Transaction status ('pending', 'success', 'error')
- `message`: Status message
- `txHash`: Transaction hash (optional)
- `onClose`: Function to handle close event

**Example Usage:**
```jsx
import { TransactionStatus } from './components/common';

function TransactionPage() {
  const [txStatus, setTxStatus] = useState(null);
  
  return (
    <div>
      {txStatus && (
        <TransactionStatus
          status={txStatus.status}
          message={txStatus.message}
          txHash={txStatus.hash}
          onClose={() => setTxStatus(null)}
        />
      )}
    </div>
  );
}
```

## Guided Workflow Components

### GuidedWorkflow

A container component that manages multi-step workflows.

**Props:**
- `steps`: Array of step components
- `initialStep`: Initial step index (optional)
- `onComplete`: Function called when workflow completes
- `onCancel`: Function called when workflow is cancelled

**Example Usage:**
```jsx
import { GuidedWorkflow } from './components/guided-workflow';
import Step1 from './components/guided-workflow/Step1';
import Step2 from './components/guided-workflow/Step2';
import Step3 from './components/guided-workflow/Step3';

function WorkflowPage() {
  return (
    <GuidedWorkflow
      steps={[Step1, Step2, Step3]}
      initialStep={0}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
```

### TradingWorkflowIntro

Introduction step for the trading workflow.

**Props:**
- `onNext`: Function to move to next step
- `onCancel`: Function to cancel workflow

**Example Usage:**
```jsx
import { TradingWorkflowIntro } from './components/guided-workflow';

function IntroStep({ onNext, onCancel }) {
  return (
    <TradingWorkflowIntro
      onNext={onNext}
      onCancel={onCancel}
    />
  );
}
```

### BuyWorkflowSelectOffer

Step for selecting an offer in the buy workflow.

**Props:**
- `onNext`: Function to move to next step
- `onBack`: Function to go back to previous step
- `onSelectOffer`: Function to handle offer selection

**Example Usage:**
```jsx
import { BuyWorkflowSelectOffer } from './components/guided-workflow';

function SelectOfferStep({ onNext, onBack, onSelectOffer }) {
  return (
    <BuyWorkflowSelectOffer
      onNext={onNext}
      onBack={onBack}
      onSelectOffer={onSelectOffer}
    />
  );
}
```

## Profile Components

### ProfileHeader

Displays user avatar, username, and wallet address.

**Props:**
- `user`: User object with profile information
- `isCurrentUser`: Boolean indicating if profile belongs to current user
- `onEdit`: Function to handle edit action (for current user)

**Example Usage:**
```jsx
import { ProfileHeader } from './components/profile';

function UserProfileHeader({ user, isCurrentUser }) {
  return (
    <ProfileHeader
      user={user}
      isCurrentUser={isCurrentUser}
      onEdit={handleEditProfile}
    />
  );
}
```

### ReputationCard

Visualizes user reputation metrics.

**Props:**
- `reputationScore`: Numerical reputation score
- `successfulTrades`: Number of successful trades
- `disputedTrades`: Number of disputed trades

**Example Usage:**
```jsx
import { ReputationCard } from './components/profile';

function UserReputation({ userData }) {
  return (
    <ReputationCard
      reputationScore={userData.reputation}
      successfulTrades={userData.successfulTrades}
      disputedTrades={userData.disputedTrades}
    />
  );
}
```

### TransactionHistory

Displays user transaction history with filtering and pagination.

**Props:**
- `transactions`: Array of transaction objects
- `isLoading`: Boolean to indicate loading state
- `onPageChange`: Function to handle pagination
- `filters`: Object containing filter criteria (optional)

**Example Usage:**
```jsx
import { TransactionHistory } from './components/profile';

function UserTransactions({ userData }) {
  return (
    <TransactionHistory
      transactions={userData.transactions}
      isLoading={isLoadingTransactions}
      onPageChange={handlePageChange}
      filters={{
        type: 'all',
        dateRange: '30days'
      }}
    />
  );
}
```

## Notification Components

### NotificationCenter

Dropdown notification center component.

**Props:**
- `notifications`: Array of notification objects
- `onRead`: Function to mark notification as read
- `onDelete`: Function to delete notification
- `onReadAll`: Function to mark all notifications as read
- `onDeleteAll`: Function to delete all notifications

**Example Usage:**
```jsx
import { NotificationCenter } from './components/notifications';
import { useNotifications } from './components/notifications/NotificationContext';

function Header() {
  const { 
    notifications,
    markAsRead,
    removeNotification,
    markAllAsRead,
    removeAllNotifications
  } = useNotifications();
  
  return (
    <div className="header">
      <NotificationCenter
        notifications={notifications}
        onRead={markAsRead}
        onDelete={removeNotification}
        onReadAll={markAllAsRead}
        onDeleteAll={removeAllNotifications}
      />
    </div>
  );
}
```

### ToastNotification

Temporary toast notification component.

**Props:**
- `type`: Notification type ('success', 'error', 'warning', 'info')
- `title`: Notification title
- `message`: Notification message
- `duration`: Display duration in milliseconds
- `onClose`: Function to handle close event

**Example Usage:**
```jsx
import { ToastNotification } from './components/notifications';

function App() {
  const [toast, setToast] = useState(null);
  
  return (
    <div className="app">
      {toast && (
        <ToastNotification
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
```

## State Management

### NotificationContext

Context provider for the notification system.

**Provides:**
- `notifications`: Array of notification objects
- `notifySuccess`: Function to show success notification
- `notifyError`: Function to show error notification
- `notifyWarning`: Function to show warning notification
- `notifyInfo`: Function to show info notification
- `markAsRead`: Function to mark notification as read
- `removeNotification`: Function to delete notification
- `markAllAsRead`: Function to mark all notifications as read
- `removeAllNotifications`: Function to delete all notifications

**Example Usage:**
```jsx
import { NotificationProvider, useNotifications } from './components/notifications/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <MainContent />
    </NotificationProvider>
  );
}

function MainContent() {
  const { notifySuccess, notifyError } = useNotifications();
  
  const handleAction = async () => {
    try {
      // Action logic
      notifySuccess('Success', 'Action completed successfully');
    } catch (error) {
      notifyError('Error', error.message);
    }
  };
  
  return (
    <button onClick={handleAction}>Perform Action</button>
  );
}
```

## Styling System

The SVMP2P platform uses a comprehensive theming system with CSS variables for consistent styling.

### Theme Variables

CSS variables are defined in `src/styles/theme/variables.css`:

```css
:root {
  /* Colors */
  --color-primary: #3498db;
  --color-secondary: #2ecc71;
  --color-accent: #9b59b6;
  --color-background: #ffffff;
  --color-text: #333333;
  --color-text-light: #666666;
  --color-border: #dddddd;
  --color-error: #e74c3c;
  --color-warning: #f39c12;
  --color-success: #2ecc71;
  --color-info: #3498db;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;
  
  /* Borders */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 1rem;
  --border-radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
}
```

### Component-Specific Styles

Component styles are organized in separate files:

- `buttons.css`: Button styles
- `cards.css`: Card component styles
- `forms.css`: Form element styles
- `typography.css`: Text styling
- `layout.css`: Layout utilities
- `tables.css`: Table styles

## Testing Components

### Component Testing

Components are tested using Jest and React Testing Library. Test files are located in the `src/tests` directory.

**Example Test:**
```jsx
// src/tests/OfferCreation.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import OfferCreation from '../components/OfferCreation';

describe('OfferCreation', () => {
  test('renders form elements', () => {
    render(<OfferCreation onSubmit={() => {}} />);
    
    expect(screen.getByLabelText(/asset type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment methods/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create offer/i })).toBeInTheDocument();
  });
  
  test('validates form inputs', () => {
    render(<OfferCreation onSubmit={() => {}} />);
    
    fireEvent.click(screen.getByRole('button', { name: /create offer/i }));
    
    expect(screen.getByText(/asset type is required/i)).toBeInTheDocument();
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    expect(screen.getByText(/price is required/i)).toBeInTheDocument();
  });
  
  test('submits form with valid data', () => {
    const handleSubmit = jest.fn();
    render(<OfferCreation onSubmit={handleSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/asset type/i), { target: { value: 'SOL' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '1.5' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '100' } });
    fireEvent.click(screen.getByLabelText(/usdc/i));
    fireEvent.change(screen.getByLabelText(/terms/i), { target: { value: 'Payment within 30 minutes' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create offer/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith({
      assetType: 'SOL',
      amount: '1.5',
      price: '100',
      paymentMethods: ['USDC'],
      terms: 'Payment within 30 minutes'
    });
  });
});
```

### Snapshot Testing

Snapshot tests ensure UI components maintain consistent appearance.

**Example Snapshot Test:**
```jsx
// src/tests/ProfileHeader.test.js
import { render } from '@testing-library/react';
import { ProfileHeader } from '../components/profile';

describe('ProfileHeader', () => {
  test('matches snapshot', () => {
    const user = {
      username: 'testuser',
      walletAddress: '5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAQmNBZnZoYXj1',
      avatarUrl: 'https://example.com/avatar.png'
    };
    
    const { container } = render(
      <ProfileHeader
        user={user}
        isCurrentUser={false}
        onEdit={() => {}}
      />
    );
    
    expect(container).toMatchSnapshot();
  });
});
```

### Integration Testing

Integration tests verify that components work together correctly.

**Example Integration Test:**
```jsx
// src/tests/NotificationSystem.test.js
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotificationProvider } from '../components/notifications/NotificationContext';
import { NotificationCenter } from '../components/notifications';
import TestComponent from './TestComponent';

// TestComponent uses the notification context
function TestComponent() {
  const { notifySuccess } = useNotifications();
  
  return (
    <button onClick={() => notifySuccess('Test', 'This is a test notification')}>
      Show Notification
    </button>
  );
}

describe('Notification System', () => {
  test('shows notification when triggered', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
        <NotificationCenter />
      </NotificationProvider>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /show notification/i }));
    
    expect(await screen.findByText('Test')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification')).toBeInTheDocument();
  });
});
```
