import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * DeweyCard Component
 * 
 * Displays a task card in the ASOOS Symphony system.
 * Each card represents a task that has been assigned to or completed by an agent.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.card - Card data object
 * @param {Function} props.onCardClick - Optional click handler
 */
const DeweyCard = ({ card, onCardClick }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Handle card click
  const handleCardClick = () => {
    setExpanded(!expanded);
    if (onCardClick) {
      onCardClick(card.id);
    }
  };
  
  // Handle NFT view click (would open blockchain explorer in real implementation)
  const handleNftClick = (e) => {
    e.stopPropagation();
    // In a real implementation, this would open a blockchain explorer or NFT viewer
    console.log(`View NFT: ${card.nftRef}`);
    alert(`Viewing NFT: ${card.nftRef} on blockchain explorer`);
  };
  
  // Format timestamp for display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'badge badge-success';
      case 'in progress':
        return 'badge badge-primary';
      case 'pending':
        return 'badge bg-gray-200 text-gray-700';
      case 'failed':
        return 'badge badge-danger';
      default:
        return 'badge bg-gray-200 text-gray-700';
    }
  };
  
  // Get performance indicator
  const getPerformanceIndicator = (performance) => {
    // If performance is not a number or undefined, return empty string
    if (!performance && performance !== 0) return '';
    
    // Generate stars based on performance (1-5)
    const fullStars = Math.floor(performance);
    const emptyStars = 5 - fullStars;
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`star-full-${i}`} className="text-primary">★</span>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`star-empty-${i}`} className="text-gray-300">★</span>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`dewey-card ${expanded ? 'shadow-lg' : ''}`}
      onClick={handleCardClick}
    >
      <div className="dewey-card-header">
        <h3 className="card-title">{card.title}</h3>
        <div className="card-agent">
          {card.agentName} (Instance {card.agentInstance})
        </div>
        <div className={`status-badge ${getStatusBadgeClass(card.status)}`}>
          {card.status}
        </div>
      </div>
      
      <div className="dewey-card-body">
        <div className="card-task">
          {card.task}
        </div>
        
        {expanded && (
          <div className="card-details">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Created</p>
                <p className="font-semibold">{formatDate(card.timestamp)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Performance</p>
                <div>{getPerformanceIndicator(card.performance)}</div>
              </div>
              
              {card.nftRef && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-600">NFT Reference</p>
                  <button 
                    className="text-primary text-sm underline"
                    onClick={handleNftClick}
                  >
                    {card.nftRef}
                  </button>
                </div>
              )}
              
              {/* Additional metadata could be displayed here */}
              {card.metadata && Object.keys(card.metadata).length > 0 && (
                <div className="col-span-2 mt-2">
                  <p className="text-xs text-gray-600 mb-1">Metadata</p>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    {Object.entries(card.metadata).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-2">
                        <span className="font-medium">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="card-meta">
          <div>
            {card.status === 'Completed' && (
              <span className="text-green">✓ Verified on S2DO</span>
            )}
          </div>
          <div>
            ID: {card.id}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="dewey-card-footer">
          <button 
            className="btn btn-sm btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
          >
            Collapse
          </button>
          
          {card.actions && card.actions.length > 0 && (
            <div className="flex gap-2">
              {card.actions.map((action, index) => (
                <button
                  key={`action-${index}`}
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.handler(card.id);
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// PropTypes for type checking
DeweyCard.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    agentName: PropTypes.string.isRequired,
    agentInstance: PropTypes.string.isRequired,
    task: PropTypes.string.isRequired,
    performance: PropTypes.number,
    nftRef: PropTypes.string,
    timestamp: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    metadata: PropTypes.object,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        handler: PropTypes.func.isRequired
      })
    )
  }).isRequired,
  onCardClick: PropTypes.func
};

DeweyCard.defaultProps = {
  onCardClick: null
};

export default DeweyCard;

