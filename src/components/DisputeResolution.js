import React, { useState, useContext, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { AppContext } from '../AppContext';
import idl from '../idl/p2p_exchange.json'; // This will be the IDL for your program

export const DisputeResolution = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useContext(AppContext);
  
  // State
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [voteChoice, setVoteChoice] = useState('');
  
  // Create Anchor provider and program
  const getProgram = () => {
    if (!wallet.publicKey) return null;
    
    const provider = new AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: 'processed' }
    );
    
    return new Program(idl, new PublicKey(network.programId), provider);
  };
  
  // Fetch disputes
  useEffect(() => {
    const fetchDisputes = async () => {
      setLoading(true);
      setError('');
      
      try {
        const program = getProgram();
        if (!program) {
          // If wallet is not connected, simulate disputes for display
          setDisputes(generateMockDisputes());
          setLoading(false);
          return;
        }
        
        // Fetch all disputes
        const fetchedDisputes = await program.account.dispute.all();
        
        // Process and set disputes
        setDisputes(fetchedDisputes.map(item => ({
          id: item.publicKey.toString(),
          offer: item.account.offer.toString(),
          initiator: item.account.initiator.toString(),
          respondent: item.account.respondent.toString(),
          jurors: item.account.jurors.map(juror => juror.toString()),
          evidenceBuyer: item.account.evidenceBuyer,
          evidenceSeller: item.account.evidenceSeller,
          votesForBuyer: item.account.votesForBuyer,
          votesForSeller: item.account.votesForSeller,
          status: getDisputeStatusText(item.account.status),
          statusCode: item.account.status,
          createdAt: new Date(item.account.createdAt.toNumber() * 1000).toLocaleString(),
          resolvedAt: item.account.resolvedAt.toNumber() > 0 
            ? new Date(item.account.resolvedAt.toNumber() * 1000).toLocaleString()
            : 'Not resolved yet',
        })));
      } catch (err) {
        console.error('Error fetching disputes:', err);
        setError('Failed to fetch disputes. Using mock data instead.');
        setDisputes(generateMockDisputes());
      } finally {
        setLoading(false);
      }
    };
    
    fetchDisputes();
  }, [wallet.publicKey, network]);
  
  // Helper to get dispute status text from status code
  const getDisputeStatusText = (statusCode) => {
    const statusMap = {
      0: 'Opened',
      1: 'Jurors Assigned',
      2: 'Evidence Submission',
      3: 'Voting',
      4: 'Verdict Reached',
      5: 'Resolved'
    };
    return statusMap[statusCode] || 'Unknown';
  };
  
  // Generate mock disputes for display when wallet is not connected
  const generateMockDisputes = () => {
    const mockDisputes = [];
    const statuses = ['Opened', 'Jurors Assigned', 'Evidence Submission', 'Voting', 'Verdict Reached', 'Resolved'];
    
    for (let i = 0; i < 5; i++) {
      const statusIndex = Math.floor(Math.random() * statuses.length);
      const votesForBuyer = Math.floor(Math.random() * 5);
      const votesForSeller = Math.floor(Math.random() * 5);
      
      mockDisputes.push({
        id: `mock-dispute-${i}`,
        offer: `mock-offer-${i}`,
        initiator: Math.random() > 0.5 ? 'Buyer' + Math.floor(Math.random() * 1000) : 'Seller' + Math.floor(Math.random() * 1000),
        respondent: Math.random() > 0.5 ? 'Buyer' + Math.floor(Math.random() * 1000) : 'Seller' + Math.floor(Math.random() * 1000),
        jurors: Array(3).fill().map((_, j) => `Juror${j}-${Math.floor(Math.random() * 1000)}`),
        evidenceBuyer: statusIndex >= 2 ? ['ipfs://QmXyz...'] : [],
        evidenceSeller: statusIndex >= 2 ? ['ipfs://QmAbc...'] : [],
        votesForBuyer: statusIndex >= 3 ? votesForBuyer : 0,
        votesForSeller: statusIndex >= 3 ? votesForSeller : 0,
        status: statuses[statusIndex],
        statusCode: statusIndex,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toLocaleString(),
        resolvedAt: statusIndex >= 5 
          ? new Date(Date.now() - Math.random() * 1000000000).toLocaleString()
          : 'Not resolved yet',
      });
    }
    
    return mockDisputes;
  };
  
  // Handle submitting evidence
  const handleSubmitEvidence = async (disputeId) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!evidenceUrl) {
      setError('Please enter an evidence URL');
      return;
    }
    
    setActionInProgress(true);
    setStatusMessage('Submitting evidence...');
    setError('');
    
    try {
      const program = getProgram();
      if (!program) {
        throw new Error('Failed to initialize program');
      }
      
      const disputePublicKey = new PublicKey(disputeId);
      
      await program.methods
        .submitEvidence(evidenceUrl)
        .accounts({
          dispute: disputePublicKey,
          submitter: wallet.publicKey,
        })
        .rpc();
      
      setStatusMessage('Evidence submitted successfully!');
      setEvidenceUrl('');
      
      // Refresh disputes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting evidence:', err);
      setError(`Failed to submit evidence: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle casting a vote
  const handleCastVote = async (disputeId) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!voteChoice) {
      setError('Please select a vote choice');
      return;
    }
    
    setActionInProgress(true);
    setStatusMessage('Casting vote...');
    setError('');
    
    try {
      const program = getProgram();
      if (!program) {
        throw new Error('Failed to initialize program');
      }
      
      const disputePublicKey = new PublicKey(disputeId);
      
      // Generate a new account for the vote
      const vote = web3.Keypair.generate();
      
      await program.methods
        .castVote(voteChoice === 'buyer')
        .accounts({
          dispute: disputePublicKey,
          juror: wallet.publicKey,
          vote: vote.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([vote])
        .rpc();
      
      setStatusMessage('Vote cast successfully!');
      setVoteChoice('');
      
      // Refresh disputes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error casting vote:', err);
      setError(`Failed to cast vote: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Check if user is a juror for a dispute
  const isJuror = (dispute) => {
    if (!wallet.publicKey) return false;
    return dispute.jurors.includes(wallet.publicKey.toString());
  };
  
  // Check if user is the initiator of a dispute
  const isInitiator = (dispute) => {
    if (!wallet.publicKey) return false;
    return dispute.initiator === wallet.publicKey.toString();
  };
  
  // Check if user is the respondent in a dispute
  const isRespondent = (dispute) => {
    if (!wallet.publicKey) return false;
    return dispute.respondent === wallet.publicKey.toString();
  };
  
  // Render action panel based on dispute status and user role
  const renderActionPanel = (dispute) => {
    if (!wallet.publicKey) {
      return (
        <div className="action-panel">
          <p>Connect your wallet to interact with disputes.</p>
          <button className="action-button connect-wallet" disabled={actionInProgress}>
            Connect Wallet
          </button>
        </div>
      );
    }
    
    switch (dispute.status) {
      case 'Evidence Submission':
        if (isInitiator(dispute) || isRespondent(dispute)) {
          return (
            <div className="action-panel">
              <h3>Submit Evidence</h3>
              <p>Provide evidence to support your case. Upload your evidence to IPFS and paste the URL below.</p>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="IPFS URL (ipfs://...)"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
                <button
                  className="action-button submit-evidence"
                  disabled={actionInProgress || !evidenceUrl}
                  onClick={() => handleSubmitEvidence(dispute.id)}
                >
                  Submit Evidence
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="action-panel">
            <p>Waiting for parties to submit evidence.</p>
          </div>
        );
        
      case 'Voting':
        if (isJuror(dispute)) {
          return (
            <div className="action-panel">
              <h3>Cast Your Vote</h3>
              <p>As a juror, you must review the evidence and cast your vote.</p>
              <div className="form-group">
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="voteChoice"
                      value="buyer"
                      checked={voteChoice === 'buyer'}
                      onChange={() => setVoteChoice('buyer')}
                    />
                    Vote for Buyer
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="voteChoice"
                      value="seller"
                      checked={voteChoice === 'seller'}
                      onChange={() => setVoteChoice('seller')}
                    />
                    Vote for Seller
                  </label>
                </div>
                <button
                  className="action-button cast-vote"
                  disabled={actionInProgress || !voteChoice}
                  onClick={() => handleCastVote(dispute.id)}
                >
                  Cast Vote
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="action-panel">
            <p>Jurors are currently voting on this dispute.</p>
            <p>Current votes: {dispute.votesForBuyer} for buyer, {dispute.votesForSeller} for seller.</p>
          </div>
        );
        
      case 'Verdict Reached':
        return (
          <div className="action-panel">
            <h3>Verdict Reached</h3>
            <p>
              The jurors have reached a verdict: 
              {dispute.votesForBuyer > dispute.votesForSeller 
                ? ' In favor of the buyer.' 
                : ' In favor of the seller.'}
            </p>
            <p>Votes for buyer: {dispute.votesForBuyer}</p>
            <p>Votes for seller: {dispute.votesForSeller}</p>
            <p>The smart contract will automatically execute the verdict.</p>
          </div>
        );
        
      case 'Resolved':
        return (
          <div className="action-panel">
            <h3>Dispute Resolved</h3>
            <p>
              This dispute has been resolved 
              {dispute.votesForBuyer > dispute.votesForSeller 
                ? ' in favor of the buyer.' 
                : ' in favor of the seller.'}
            </p>
            <p>Resolved at: {dispute.resolvedAt}</p>
          </div>
        );
        
      default:
        return (
          <div className="action-panel">
            <p>Current status: {dispute.status}</p>
            <p>Please wait for the next phase of the dispute resolution process.</p>
          </div>
        );
    }
  };
  
  return (
    <div className="dispute-resolution-container">
      <h2>Dispute Resolution</h2>
      <p>View and participate in dispute resolution for P2P trades.</p>
      
      {error && <div className="error-message">{error}</div>}
      {statusMessage && <div className="status-message">{statusMessage}</div>}
      
      {loading ? (
        <div className="loading">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="no-disputes">No disputes found.</div>
      ) : (
        <div className="disputes-section">
          <div className="disputes-list">
            <h3>Active Disputes</h3>
            {disputes.map(dispute => (
              <div 
                key={dispute.id} 
                className={`dispute-item ${selectedDispute?.id === dispute.id ? 'selected' : ''}`}
                onClick={() => setSelectedDispute(dispute)}
              >
                <div className="dispute-header">
                  <div className={`status-badge status-${dispute.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {dispute.status}
                  </div>
                  <div className="dispute-id">ID: {dispute.id.substring(0, 8)}...</div>
                </div>
                <div className="dispute-parties">
                  <div className="initiator">
                    Initiator: {dispute.initiator.substring(0, 4)}...{dispute.initiator.substring(dispute.initiator.length - 4)}
                  </div>
                  <div className="respondent">
                    Respondent: {dispute.respondent.substring(0, 4)}...{dispute.respondent.substring(dispute.respondent.length - 4)}
                  </div>
                </div>
                <div className="dispute-date">
                  Created: {dispute.createdAt}
                </div>
              </div>
            ))}
          </div>
          
          {selectedDispute && (
            <div className="dispute-details">
              <h3>Dispute Details</h3>
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className={`value status-${selectedDispute.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {selectedDispute.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Offer ID:</span>
                <span className="value">{selectedDispute.offer}</span>
              </div>
              <div className="detail-item">
                <span className="label">Initiator:</span>
                <span className="value">{selectedDispute.initiator}</span>
              </div>
              <div className="detail-item">
                <span className="label">Respondent:</span>
                <span className="value">{selectedDispute.respondent}</span>
              </div>
              <div className="detail-item">
                <span className="label">Created:</span>
                <span className="value">{selectedDispute.createdAt}</span>
              </div>
              
              {selectedDispute.statusCode >= 1 && (
                <div className="detail-item">
                  <span className="label">Jurors:</span>
                  <div className="value jurors-list">
                    {selectedDispute.jurors.map((juror, index) => (
                      <div key={index} className="juror-item">
                        {juror.substring(0, 4)}...{juror.substring(juror.length - 4)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedDispute.statusCode >= 2 && (
                <div className="evidence-section">
                  <h4>Evidence</h4>
                  <div className="evidence-list">
                    <div className="evidence-party">
                      <h5>Buyer Evidence:</h5>
                      {selectedDispute.evidenceBuyer.length > 0 ? (
                        <ul>
                          {selectedDispute.evidenceBuyer.map((evidence, index) => (
                            <li key={index}>
                              <a href={evidence} target="_blank" rel="noopener noreferrer">
                                {evidence}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No evidence submitted yet.</p>
                      )}
                    </div>
                    <div className="evidence-party">
                      <h5>Seller Evidence:</h5>
                      {selectedDispute.evidenceSeller.length > 0 ? (
                        <ul>
                          {selectedDispute.evidenceSeller.map((evidence, index) => (
                            <li key={index}>
                              <a href={evidence} target="_blank" rel="noopener noreferrer">
                                {evidence}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No evidence submitted yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedDispute.statusCode >= 3 && (
                <div className="voting-section">
                  <h4>Voting Results</h4>
                  <div className="votes-display">
                    <div className="vote-bar">
                      <div 
                        className="buyer-votes" 
                        style={{
                          width: `${selectedDispute.votesForBuyer / (selectedDispute.votesForBuyer + selectedDispute.votesForSeller) * 100}%`
                        }}
                      >
                        {selectedDispute.votesForBuyer}
                      </div>
                      <div 
                        className="seller-votes"
                        style={{
                          width: `${selectedDispute.votesForSeller / (selectedDispute.votesForBuyer + selectedDispute.votesForSeller) * 100}%`
                        }}
                      >
                        {selectedDispute.votesForSeller}
                      </div>
                    </div>
                    <div className="vote-labels">
                      <span>Buyer</span>
                      <span>Seller</span>
                    </div>
                  </div>
                </div>
              )}
              
              {renderActionPanel(selectedDispute)}
            </div>
          )}
        </div>
      )}
      
      <div className="dispute-info">
        <h3>About Dispute Resolution</h3>
        <p>The OpenSVM P2P Exchange uses a decentralized dispute resolution system to handle conflicts between buyers and sellers.</p>
        <p>When a dispute is opened, a panel of jurors is randomly selected to review evidence and vote on the outcome.</p>
        <p>The verdict is determined by majority vote, and the smart contract automatically executes the decision.</p>
        <p>This ensures a fair and transparent process for resolving disputes in the P2P marketplace.</p>
      </div>
    </div>
  );
};
