# Smart Contract Events Reference

**Version**: 1.0.0  
**Program ID**: `FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9`

## Overview

This document provides comprehensive documentation for all events emitted by the SVMP2P smart contract program. Events provide real-time notifications of important state changes and can be monitored by frontend applications for user interface updates.

## Table of Contents

- [Event Monitoring](#event-monitoring)
- [Offer Management Events](#offer-management-events)
- [Dispute Resolution Events](#dispute-resolution-events)
- [Reputation System Events](#reputation-system-events)
- [Reward System Events](#reward-system-events)
- [Event Filtering and Parsing](#event-filtering-and-parsing)

---

## Event Monitoring

### Setting Up Event Listeners

```typescript
import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

interface EventListener {
  program: Program;
  connection: Connection;
  subscriptions: Map<string, number>;
}

const setupEventListener = (program: Program): EventListener => {
  const listener: EventListener = {
    program,
    connection: program.provider.connection,
    subscriptions: new Map(),
  };
  
  return listener;
};

const subscribeToEvents = (listener: EventListener, eventName: string, callback: (event: any) => void) => {
  const subscription = listener.program.addEventListener(eventName, callback);
  listener.subscriptions.set(eventName, subscription);
  
  console.log(`Subscribed to ${eventName} events`);
  return subscription;
};
```

### Event Data Structure

All events include common metadata:

```typescript
interface BaseEvent {
  signature: string;     // Transaction signature
  slot: number;          // Slot number
  blockTime: number;     // Block timestamp
  eventName: string;     // Event type identifier
}
```

---

## Offer Management Events

### `OfferCreated`

Emitted when a new offer is created with escrowed SOL.

**Event Structure**:
```typescript
interface OfferCreatedEvent {
  offer: PublicKey;        // Offer account public key
  seller: PublicKey;       // Seller's public key
  amount: BN;              // SOL amount in lamports
  fiatAmount: BN;          // Fiat amount in smallest unit
  fiatCurrency: string;    // Currency code (e.g., "USD")
  paymentMethod: string;   // Payment method description
  timestamp: BN;           // Creation timestamp
}
```

**Usage Example**:
```typescript
const subscribeToOfferCreated = (listener: EventListener) => {
  return subscribeToEvents(listener, 'OfferCreated', (event: OfferCreatedEvent) => {
    console.log('New offer created:', {
      offerId: event.offer.toString(),
      seller: event.seller.toString(),
      amount: `${event.amount.toNumber() / LAMPORTS_PER_SOL} SOL`,
      fiatAmount: `${event.fiatAmount.toNumber() / 100} ${event.fiatCurrency}`,
      paymentMethod: event.paymentMethod,
    });
    
    // Update UI with new offer
    updateOfferList(event);
  });
};
```

### `OfferListed`

Emitted when an offer becomes publicly visible in the marketplace.

**Event Structure**:
```typescript
interface OfferListedEvent {
  offer: PublicKey;      // Offer account public key
  seller: PublicKey;     // Seller's public key
  timestamp: BN;         // Listing timestamp
}
```

**Usage Example**:
```typescript
const subscribeToOfferListed = (listener: EventListener) => {
  return subscribeToEvents(listener, 'OfferListed', (event: OfferListedEvent) => {
    console.log('Offer listed publicly:', event.offer.toString());
    
    // Show offer in marketplace UI
    showOfferInMarketplace(event.offer);
  });
};
```

### `OfferAccepted`

Emitted when a buyer accepts an offer and locks in security bond.

**Event Structure**:
```typescript
interface OfferAcceptedEvent {
  offer: PublicKey;        // Offer account public key
  seller: PublicKey;       // Seller's public key
  buyer: PublicKey;        // Buyer's public key
  securityBond: BN;        // Security bond amount
  timestamp: BN;           // Acceptance timestamp
}
```

**Usage Example**:
```typescript
const subscribeToOfferAccepted = (listener: EventListener) => {
  return subscribeToEvents(listener, 'OfferAccepted', (event: OfferAcceptedEvent) => {
    console.log('Offer accepted:', {
      offerId: event.offer.toString(),
      buyer: event.buyer.toString(),
      bond: `${event.securityBond.toNumber() / LAMPORTS_PER_SOL} SOL`,
    });
    
    // Update offer status in UI
    updateOfferStatus(event.offer, 'ACCEPTED');
    
    // Notify participants
    notifyTradeParticipants(event.seller, event.buyer, event.offer);
  });
};
```

### `FiatMarkedSent`

Emitted when buyer marks fiat payment as sent.

**Event Structure**:
```typescript
interface FiatMarkedSentEvent {
  offer: PublicKey;      // Offer account public key
  buyer: PublicKey;      // Buyer's public key
  timestamp: BN;         // Sent timestamp
}
```

### `FiatReceiptConfirmed`

Emitted when seller confirms fiat payment receipt.

**Event Structure**:
```typescript
interface FiatReceiptConfirmedEvent {
  offer: PublicKey;      // Offer account public key
  seller: PublicKey;     // Seller's public key
  timestamp: BN;         // Confirmation timestamp
}
```

### `SolReleased`

Emitted when escrowed SOL is released to buyer, completing the trade.

**Event Structure**:
```typescript
interface SolReleasedEvent {
  offer: PublicKey;      // Offer account public key
  seller: PublicKey;     // Seller's public key
  buyer: PublicKey;      // Buyer's public key
  amount: BN;            // Released SOL amount
  timestamp: BN;         // Release timestamp
}
```

**Usage Example**:
```typescript
const subscribeToSolReleased = (listener: EventListener) => {
  return subscribeToEvents(listener, 'SolReleased', (event: SolReleasedEvent) => {
    console.log('Trade completed successfully:', {
      offerId: event.offer.toString(),
      amount: `${event.amount.toNumber() / LAMPORTS_PER_SOL} SOL`,
    });
    
    // Update trade status
    updateOfferStatus(event.offer, 'COMPLETED');
    
    // Show success notification
    showTradeCompletionNotification(event);
    
    // Update user reputation
    updateUserReputation(event.seller, event.buyer, true);
  });
};
```

---

## Dispute Resolution Events

### `DisputeOpened`

Emitted when a dispute is opened for a trade.

**Event Structure**:
```typescript
interface DisputeOpenedEvent {
  dispute: PublicKey;    // Dispute account public key
  offer: PublicKey;      // Related offer account
  initiator: PublicKey;  // Who opened the dispute
  respondent: PublicKey; // Other party in the trade
  reason: string;        // Dispute reason
  timestamp: BN;         // Opening timestamp
}
```

**Usage Example**:
```typescript
const subscribeToDisputeOpened = (listener: EventListener) => {
  return subscribeToEvents(listener, 'DisputeOpened', (event: DisputeOpenedEvent) => {
    console.log('Dispute opened:', {
      disputeId: event.dispute.toString(),
      offerId: event.offer.toString(),
      reason: event.reason,
    });
    
    // Update offer status
    updateOfferStatus(event.offer, 'DISPUTED');
    
    // Notify admin for juror assignment
    notifyAdminOfNewDispute(event);
    
    // Show dispute notice to participants
    showDisputeNotification(event);
  });
};
```

### `JurorsAssigned`

Emitted when admin assigns jurors to a dispute.

**Event Structure**:
```typescript
interface JurorsAssignedEvent {
  dispute: PublicKey;      // Dispute account public key
  jurors: PublicKey[];     // Array of 3 assigned jurors
  timestamp: BN;           // Assignment timestamp
}
```

### `EvidenceSubmitted`

Emitted when evidence is submitted by dispute participants.

**Event Structure**:
```typescript
interface EvidenceSubmittedEvent {
  dispute: PublicKey;      // Dispute account public key
  submitter: PublicKey;    // Who submitted evidence
  evidenceUrl: string;     // URL to evidence document
  evidenceCount: number;   // Total evidence count for submitter
  timestamp: BN;           // Submission timestamp
}
```

### `VoteCast`

Emitted when a juror casts their vote.

**Event Structure**:
```typescript
interface VoteCastEvent {
  dispute: PublicKey;      // Dispute account public key
  juror: PublicKey;        // Juror who voted
  voteForBuyer: boolean;   // Vote direction
  votesForBuyer: number;   // Current buyer vote count
  votesForSeller: number;  // Current seller vote count
  timestamp: BN;           // Vote timestamp
}
```

### `VerdictExecuted`

Emitted when final verdict is executed and funds distributed.

**Event Structure**:
```typescript
interface VerdictExecutedEvent {
  dispute: PublicKey;      // Dispute account public key
  offer: PublicKey;        // Related offer account
  winner: PublicKey;       // Dispute winner
  amount: BN;              // Distributed amount
  finalVotes: {
    forBuyer: number;
    forSeller: number;
  };
  timestamp: BN;           // Execution timestamp
}
```

---

## Reputation System Events

### `ReputationCreated`

Emitted when a user reputation account is initialized.

**Event Structure**:
```typescript
interface ReputationCreatedEvent {
  user: PublicKey;         // User's public key
  timestamp: BN;           // Creation timestamp
}
```

### `ReputationUpdated`

Emitted when user reputation is updated based on trade outcomes.

**Event Structure**:
```typescript
interface ReputationUpdatedEvent {
  user: PublicKey;         // User's public key
  successfulTrades: number; // Updated successful trade count
  disputedTrades: number;   // Updated disputed trade count
  disputesWon: number;      // Updated disputes won count
  rating: number;           // New reputation rating (0-100)
  totalVolume: BN;          // Total trading volume
  timestamp: BN;            // Update timestamp
}
```

---

## Reward System Events

### `RewardTokenCreated`

Emitted when the reward token system is initialized.

**Event Structure**:
```typescript
interface RewardTokenCreatedEvent {
  mint: PublicKey;             // Reward token mint
  authority: PublicKey;        // System authority
  rewardRatePerTrade: BN;      // Tokens per trade
  rewardRatePerVote: BN;       // Tokens per vote
  minTradeVolume: BN;          // Minimum qualifying volume
  timestamp: BN;               // Creation timestamp
}
```

### `UserRewardsCreated`

Emitted when a user rewards account is created.

**Event Structure**:
```typescript
interface UserRewardsCreatedEvent {
  user: PublicKey;           // User's public key
  tokenAccount: PublicKey;   // User's token account
  timestamp: BN;             // Creation timestamp
}
```

### `RewardsEarned`

Emitted when user earns rewards from trading or voting.

**Event Structure**:
```typescript
interface RewardsEarnedEvent {
  user: PublicKey;         // User who earned rewards
  amount: BN;              // Reward amount earned
  rewardType: string;      // "trade" or "vote"
  tradeVolume?: BN;        // Trade volume (if trade reward)
  totalEarned: BN;         // User's total earned rewards
  timestamp: BN;           // Earning timestamp
}
```

### `RewardsClaimed`

Emitted when user claims accumulated rewards.

**Event Structure**:
```typescript
interface RewardsClaimedEvent {
  user: PublicKey;         // User who claimed rewards
  amount: BN;              // Amount claimed
  totalClaimed: BN;        // User's total claimed rewards
  remainingBalance: BN;    // Remaining unclaimed balance
  timestamp: BN;           // Claim timestamp
}
```

---

## Event Filtering and Parsing

### Filtering Events by User

```typescript
const filterEventsByUser = (
  listener: EventListener,
  userPublicKey: PublicKey,
  eventTypes: string[]
) => {
  eventTypes.forEach(eventType => {
    subscribeToEvents(listener, eventType, (event: any) => {
      // Check if event involves the specified user
      const isUserInvolved = 
        event.user?.equals(userPublicKey) ||
        event.seller?.equals(userPublicKey) ||
        event.buyer?.equals(userPublicKey) ||
        event.initiator?.equals(userPublicKey) ||
        event.juror?.equals(userPublicKey);
      
      if (isUserInvolved) {
        handleUserEvent(eventType, event);
      }
    });
  });
};
```

### Parsing Event Data

```typescript
const parseEventData = (eventData: any, eventType: string): any => {
  try {
    switch (eventType) {
      case 'OfferCreated':
        return {
          ...eventData,
          amountSOL: eventData.amount.toNumber() / LAMPORTS_PER_SOL,
          fiatAmountFormatted: formatCurrency(
            eventData.fiatAmount.toNumber(),
            eventData.fiatCurrency
          ),
        };
      
      case 'RewardsEarned':
        return {
          ...eventData,
          amountFormatted: formatTokenAmount(eventData.amount),
          rewardTypeDisplay: eventData.rewardType === 'trade' ? 'Trading' : 'Governance',
        };
      
      default:
        return eventData;
    }
  } catch (error) {
    console.error(`Failed to parse ${eventType} event:`, error);
    return eventData;
  }
};
```

### Event History Queries

```typescript
const getEventHistory = async (
  connection: Connection,
  programId: PublicKey,
  eventType?: string,
  userFilter?: PublicKey
): Promise<any[]> => {
  try {
    // Get recent transactions for the program
    const signatures = await connection.getSignaturesForAddress(
      programId,
      { limit: 100 }
    );
    
    const events = [];
    
    for (const sigInfo of signatures) {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: 'confirmed',
      });
      
      if (tx?.meta?.logMessages) {
        const parsedEvents = parseTransactionLogs(
          tx.meta.logMessages,
          eventType,
          userFilter
        );
        events.push(...parsedEvents);
      }
    }
    
    return events.sort((a, b) => b.blockTime - a.blockTime);
    
  } catch (error) {
    console.error('Failed to fetch event history:', error);
    return [];
  }
};
```

### Real-time Event Dashboard

```typescript
interface EventDashboard {
  listener: EventListener;
  events: Map<string, any[]>;
  filters: {
    user?: PublicKey;
    eventTypes: string[];
    maxEvents: number;
  };
}

const createEventDashboard = (
  program: Program,
  filters: EventDashboard['filters']
): EventDashboard => {
  const dashboard: EventDashboard = {
    listener: setupEventListener(program),
    events: new Map(),
    filters,
  };
  
  // Subscribe to all specified event types
  filters.eventTypes.forEach(eventType => {
    subscribeToEvents(dashboard.listener, eventType, (event: any) => {
      // Apply user filter if specified
      if (filters.user && !isEventForUser(event, filters.user)) {
        return;
      }
      
      // Add to event history
      const events = dashboard.events.get(eventType) || [];
      events.unshift({
        ...event,
        timestamp: Date.now(),
        eventType,
      });
      
      // Maintain max events limit
      if (events.length > filters.maxEvents) {
        events.splice(filters.maxEvents);
      }
      
      dashboard.events.set(eventType, events);
      
      // Update UI
      updateEventDashboard(eventType, events);
    });
  });
  
  return dashboard;
};
```

For complete integration examples and advanced event handling patterns, see the [examples directory](./examples/) and [transaction flows documentation](./transaction-flows.md).