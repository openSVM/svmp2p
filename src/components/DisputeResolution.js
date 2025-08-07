import React from 'react';
import { LoadingSpinner, TransactionStatus } from './common';

/**
 * DisputeResolution component with added loading states and transaction confirmations
 */
const DisputeResolution = ({ disputeId }) => {
  const [loading, setLoading] = React.useState(true);
  const [dispute, setDispute] = React.useState(null);
  const [evidence, setEvidence] = React.useState('');
  const [submittingEvidence, setSubmittingEvidence] = React.useState(false);
  const [voting, setVoting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [txStatus, setTxStatus] = React.useState(null);

  React.useEffect(() => {
    // Simulate loading dispute data
    const fetchDispute = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock dispute data
        const mockDispute = {
          id: disputeId || 'dispute123',
          offerId: 'offer456',
          initiator: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
          respondent: '2xRW7Ld9XwHegUMeqsS8VxEYbsZYPxnaVdqTSLLNBjAT',
          reason: 'Payment not received',
          status: 'EvidenceSubmission',
          evidenceBuyer: ['Transaction receipt screenshot'],
          evidenceSeller: [],
          votesForBuyer: 0,
          votesForSeller: 0,
          createdAt: Date.now() - 86400000,
          resolvedAt: null
        };
        
        setDispute(mockDispute);
      } catch (err) {
        console.error('Error fetching dispute:', err);
        setError(`Failed to fetch dispute: ${err.message}`);
        setTxStatus({
          status: 'error',
          message: `Failed to fetch dispute: ${err.message}`
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDispute();
  }, [disputeId]);

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    
    if (!evidence.trim()) {
      setError('Please provide evidence details');
      return;
    }
    
    setSubmittingEvidence(true);
    setTxStatus({
      status: 'pending',
      message: 'Submitting evidence...'
    });
    
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful submission
      setTxStatus({
        status: 'success',
        message: 'Evidence submitted successfully!'
      });
      
      // Update local state
      setDispute(prev => ({
        ...prev,
        evidenceSeller: [...prev.evidenceSeller, evidence]
      }));
      
      // Clear form
      setEvidence('');
    } catch (err) {
      console.error('Error submitting evidence:', err);
      setError(`Failed to submit evidence: ${err.message}`);
      setTxStatus({
        status: 'error',
        message: `Failed to submit evidence: ${err.message}`
      });
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleVote = async (forBuyer) => {
    setVoting(true);
    setTxStatus({
      status: 'pending',
      message: `Voting for ${forBuyer ? 'buyer' : 'seller'}...`
    });
    
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful vote
      setTxStatus({
        status: 'success',
        message: `Vote for ${forBuyer ? 'buyer' : 'seller'} submitted successfully!`
      });
      
      // Update local state
      setDispute(prev => ({
        ...prev,
        votesForBuyer: prev.votesForBuyer + (forBuyer ? 1 : 0),
        votesForSeller: prev.votesForSeller + (forBuyer ? 0 : 1)
      }));
    } catch (err) {
      console.error('Error voting:', err);
      setError(`Failed to submit vote: ${err.message}`);
      setTxStatus({
        status: 'error',
        message: `Failed to submit vote: ${err.message}`
      });
    } finally {
      setVoting(false);
    }
  };

  // Clear transaction status
  const handleClearTxStatus = () => {
    setTxStatus(null);
  };

  if (loading) {
    return (
      <div className="dispute-resolution-container">
        <LoadingSpinner size="large" text="Loading dispute details..." />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="dispute-resolution-container">
        <div className="error-message">Dispute not found</div>
      </div>
    );
  }

  return (
    <div className="dispute-resolution-container">
      <h2>Dispute Resolution</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {txStatus && (
        <TransactionStatus
          status={txStatus.status}
          message={txStatus.message}
          onClose={handleClearTxStatus}
        />
      )}
      
      <div className="ascii-form">
        <div className="ascii-form-header">DISPUTE DETAILS</div>
        
        <div className="ascii-form-row-2">
          <div className="ascii-field-inline">
            <label>DISPUTE ID:</label>
            <span className="ascii-code">{dispute.id}</span>
          </div>
          
          <div className="ascii-field-inline">
            <label>OFFER ID:</label>
            <span className="ascii-code">{dispute.offerId}</span>
          </div>
        </div>
        
        <div className="ascii-form-row-2">
          <div className="ascii-field-inline">
            <label>STATUS:</label>
            <span className="ascii-status ascii-status-active">{dispute.status}</span>
          </div>
          
          <div className="ascii-field-inline">
            <label>CREATED:</label>
            <span>{new Date(dispute.createdAt).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="ascii-field-inline">
          <label>REASON:</label>
          <span>{dispute.reason}</span>
        </div>
      </div>
      
      <div className="evidence-section">
        <h3>Evidence</h3>
        
        <div className="evidence-columns">
          <div className="evidence-column">
            <h4>Buyer Evidence</h4>
            {dispute.evidenceBuyer.length === 0 ? (
              <p>No evidence submitted yet</p>
            ) : (
              <ul>
                {dispute.evidenceBuyer.map((item, index) => (
                  <li key={`buyer-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="evidence-column">
            <h4>Seller Evidence</h4>
            {dispute.evidenceSeller.length === 0 ? (
              <p>No evidence submitted yet</p>
            ) : (
              <ul>
                {dispute.evidenceSeller.map((item, index) => (
                  <li key={`seller-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {dispute.status === 'EvidenceSubmission' && (
          <div className="ascii-form">
            <div className="ascii-form-header">SUBMIT EVIDENCE</div>
            <form onSubmit={handleSubmitEvidence}>
              <div className="ascii-field">
                <label htmlFor="evidence">EVIDENCE DESCRIPTION</label>
                <textarea
                  id="evidence"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Describe your evidence here..."
                  disabled={submittingEvidence}
                  required
                  rows={4}
                />
              </div>
              <div className="ascii-form-actions">
                <button 
                  type="submit" 
                  className="ascii-button-primary"
                  disabled={submittingEvidence}
                >
                  {submittingEvidence ? 'SUBMITTING...' : 'SUBMIT EVIDENCE'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {dispute.status === 'Voting' && (
        <div className="voting-section">
          <h3>Cast Your Vote</h3>
          <p>As a juror, you must review all evidence and vote for the party you believe is right.</p>
          
          <div className="voting-buttons">
            <button
              onClick={() => handleVote(true)}
              disabled={voting}
              className="vote-button vote-buyer"
            >
              {voting ? 'Voting...' : 'Vote for Buyer'}
            </button>
            
            <button
              onClick={() => handleVote(false)}
              disabled={voting}
              className="vote-button vote-seller"
            >
              {voting ? 'Voting...' : 'Vote for Seller'}
            </button>
          </div>
          
          <div className="current-votes">
            <div className="vote-count">
              <span className="label">Votes for Buyer:</span>
              <span className="value">{dispute.votesForBuyer}</span>
            </div>
            
            <div className="vote-count">
              <span className="label">Votes for Seller:</span>
              <span className="value">{dispute.votesForSeller}</span>
            </div>
          </div>
        </div>
      )}
      
      {dispute.status === 'VerdictReached' && (
        <div className="verdict-section">
          <h3>Verdict</h3>
          <p className="verdict">
            {dispute.votesForBuyer > dispute.votesForSeller
              ? 'The verdict is in favor of the Buyer.'
              : 'The verdict is in favor of the Seller.'}
          </p>
          
          <div className="final-votes">
            <div className="vote-count">
              <span className="label">Votes for Buyer:</span>
              <span className="value">{dispute.votesForBuyer}</span>
            </div>
            
            <div className="vote-count">
              <span className="label">Votes for Seller:</span>
              <span className="value">{dispute.votesForSeller}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { DisputeResolution };
export default DisputeResolution;
