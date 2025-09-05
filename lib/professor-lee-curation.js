/**
 * Professor Lee Curation System
 * Integrates with Dr. Lucy ML feedback loop for intelligent curation
 * Manages the AI-human feedback system for continuous learning
 */

const axios = require('axios');
const { WFASwarmQueue } = require('./wfa-queue');

class ProfessorLeeCurationSystem {
    constructor() {
        this.queueManager = new WFASwarmQueue();
        
        // Professor Lee's curation endpoints
        this.curationEndpoints = {
            reviewQueue: process.env.PROF_LEE_REVIEW_ENDPOINT || 'http://localhost:6000/api/review',
            feedbackAPI: process.env.PROF_LEE_FEEDBACK_ENDPOINT || 'http://localhost:6001/api/feedback',
            approvalSystem: process.env.PROF_LEE_APPROVAL_ENDPOINT || 'http://localhost:6002/api/approval',
            mlFeedbackLoop: process.env.ML_FEEDBACK_LOOP_ENDPOINT || 'http://localhost:4000/api/feedback'
        };
        
        // Curation configuration
        this.curationConfig = {
            autoApprovalThreshold: 0.9, // ML confidence threshold for auto-approval
            humanReviewThreshold: 0.7,  // Below this requires human review
            batchSize: 25,               // Organizations per curation batch
            feedbackLoopEnabled: true,
            learningMode: 'active'       // active, passive, or manual
        };
        
        // Quality gates and criteria
        this.qualityGates = {
            dataCompleteness: 0.8,
            sourceReliability: 0.75,
            mlConfidence: 0.7,
            businessRelevance: 0.8
        };
        
        this.feedbackLoop = null;
        
        console.log('👨‍🏫 Professor Lee Curation System initialized');
        console.log('🔄 AI-Human feedback loop ready');
    }

    /**
     * Initialize curation system and establish feedback loop
     */
    async initialize() {
        try {
            console.log('🔬 Initializing Professor Lee curation system...');
            
            // Initialize queue manager
            await this.queueManager.initialize();
            
            // Establish ML feedback loop connection
            await this.establishMLFeedbackLoop();
            
            // Initialize curation pipeline
            await this.initializeCurationPipeline();
            
            console.log('✅ Professor Lee curation system fully operational');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Professor Lee curation:', error);
            throw error;
        }
    }

    /**
     * Establish bidirectional feedback loop with Dr. Lucy ML system
     */
    async establishMLFeedbackLoop() {
        try {
            console.log('🔄 Establishing ML feedback loop...');
            
            const feedbackConfig = {
                system: 'professor_lee_curation',
                mode: this.curationConfig.learningMode,
                thresholds: this.qualityGates,
                auto_approval: this.curationConfig.autoApprovalThreshold,
                human_review: this.curationConfig.humanReviewThreshold
            };
            
            const response = await axios.post(`${this.curationEndpoints.mlFeedbackLoop}/establish`, feedbackConfig);
            
            if (response.data?.status === 'established') {
                console.log('✅ ML feedback loop established with Dr. Lucy');
                this.feedbackLoop = {
                    active: true,
                    sessionId: response.data.session_id,
                    lastSync: new Date().toISOString()
                };
            }
            
        } catch (error) {
            console.warn('⚠️ ML feedback loop establishment failed:', error.message);
            this.feedbackLoop = { active: false, error: error.message };
        }
    }

    /**
     * Initialize curation pipeline
     */
    async initializeCurationPipeline() {
        try {
            // Set up curation task processing
            this.queueManager.registerTaskProcessor('professor-lee-curation', async (task) => {
                return await this.processCurationTask(task);
            });
            
            console.log('📋 Curation pipeline registered with queue manager');
            
        } catch (error) {
            console.warn('⚠️ Curation pipeline initialization failed:', error.message);
        }
    }

    /**
     * Process curation task from queue
     */
    async processCurationTask(task) {
        try {
            console.log(`👨‍🏫 Processing curation task: ${task.type}`);
            
            const { data, processingType, stats } = task;
            
            // Apply quality gates
            const qualityFiltered = await this.applyQualityGates(data);
            
            // Categorize by confidence levels
            const categorized = await this.categorizeByConfidence(qualityFiltered);
            
            // Process each category
            const results = {
                autoApproved: [],
                humanReview: [],
                rejected: [],
                mlFeedback: []
            };
            
            // Auto-approve high confidence items
            if (categorized.highConfidence.length > 0) {
                results.autoApproved = await this.autoApprove(categorized.highConfidence);
            }
            
            // Queue medium confidence for human review
            if (categorized.mediumConfidence.length > 0) {
                results.humanReview = await this.queueForHumanReview(categorized.mediumConfidence);
            }
            
            // Handle low confidence items
            if (categorized.lowConfidence.length > 0) {
                results.rejected = await this.handleLowConfidence(categorized.lowConfidence);
            }
            
            // Send feedback to ML system
            if (this.feedbackLoop?.active) {
                results.mlFeedback = await this.sendMLFeedback(results);
            }
            
            console.log(`✅ Curation completed: ${results.autoApproved.length} auto-approved, ${results.humanReview.length} for human review`);
            
            return {
                status: 'completed',
                results,
                stats: {
                    total: data.length,
                    autoApproved: results.autoApproved.length,
                    humanReview: results.humanReview.length,
                    rejected: results.rejected.length,
                    feedbackSent: results.mlFeedback.length || 0
                }
            };
            
        } catch (error) {
            console.error('❌ Curation task processing failed:', error);
            throw error;
        }
    }

    /**
     * Apply quality gates to filter data
     */
    async applyQualityGates(data) {
        console.log(`🚪 Applying quality gates to ${data.length} organizations...`);
        
        const passed = [];
        const failed = [];
        
        data.forEach(org => {
            let score = 0;
            let maxScore = 0;
            
            // Data completeness check
            maxScore += 100;
            if (org.name && org.website && org.description) score += 80;
            else if (org.name && (org.website || org.description)) score += 60;
            else if (org.name) score += 40;
            
            // Source reliability check
            maxScore += 100;
            const sources = Object.keys(org).filter(key => 
                ['drMemoria', 'drMatch', 'webCrawler', 'drLucy'].includes(key)
            ).length;
            score += sources * 25; // 25 points per source
            
            // ML confidence check (if available)
            if (org.drLucy?.mlConfidence) {
                maxScore += 100;
                score += org.drLucy.mlConfidence * 100;
            }
            
            // Business relevance check
            maxScore += 100;
            if (org.industry) score += 50;
            if (org.sector) score += 30;
            if (org.employee_count || org.drLucy?.mlScores?.opportunity_score) score += 20;
            
            const finalScore = score / maxScore;
            org.qualityScore = finalScore;
            
            // Check against quality gates
            if (finalScore >= this.qualityGates.dataCompleteness) {
                passed.push(org);
            } else {
                failed.push({
                    ...org,
                    qualityFailureReason: 'Below quality threshold',
                    qualityScore: finalScore
                });
            }
        });
        
        console.log(`📊 Quality gates: ${passed.length} passed, ${failed.length} failed`);
        
        // Send failed items as feedback for ML improvement
        if (failed.length > 0 && this.feedbackLoop?.active) {
            this.sendQualityFeedback(failed);
        }
        
        return passed;
    }

    /**
     * Categorize organizations by ML confidence levels
     */
    async categorizeByConfidence(data) {
        const categories = {
            highConfidence: [],   // Auto-approve
            mediumConfidence: [], // Human review
            lowConfidence: []     // Reject or request more data
        };
        
        data.forEach(org => {
            const mlConfidence = org.drLucy?.mlConfidence || 0;
            const overallQuality = org.dataQuality || 0;
            
            // Combined confidence score
            const combinedConfidence = (mlConfidence + (overallQuality / 100)) / 2;
            
            if (combinedConfidence >= this.curationConfig.autoApprovalThreshold) {
                categories.highConfidence.push({
                    ...org,
                    combinedConfidence,
                    curationType: 'auto_approved'
                });
            } else if (combinedConfidence >= this.curationConfig.humanReviewThreshold) {
                categories.mediumConfidence.push({
                    ...org,
                    combinedConfidence,
                    curationType: 'human_review'
                });
            } else {
                categories.lowConfidence.push({
                    ...org,
                    combinedConfidence,
                    curationType: 'low_confidence'
                });
            }
        });
        
        console.log(`🔍 Categorization: ${categories.highConfidence.length} high, ${categories.mediumConfidence.length} medium, ${categories.lowConfidence.length} low confidence`);
        
        return categories;
    }

    /**
     * Auto-approve high confidence organizations
     */
    async autoApprove(organizations) {
        console.log(`✅ Auto-approving ${organizations.length} high-confidence organizations...`);
        
        const approved = organizations.map(org => ({
            ...org,
            approvalStatus: 'auto_approved',
            approvedAt: new Date().toISOString(),
            approvedBy: 'professor_lee_ai_system',
            confidence: org.combinedConfidence
        }));
        
        // Queue for sRIX leader assignment
        await this.queueManager.enqueue('srix-leaders', {
            type: 'auto_approved_organizations',
            data: approved,
            priority: 'high'
        });
        
        return approved;
    }

    /**
     * Queue organizations for human review
     */
    async queueForHumanReview(organizations) {
        console.log(`👁️ Queueing ${organizations.length} organizations for human review...`);
        
        const reviewTasks = organizations.map(org => ({
            ...org,
            reviewStatus: 'pending_human_review',
            queuedAt: new Date().toISOString(),
            reviewer: 'professor_lee',
            reviewPriority: org.combinedConfidence > 0.8 ? 'high' : 'medium'
        }));
        
        // Send to Professor Lee's review queue
        try {
            await axios.post(`${this.curationEndpoints.reviewQueue}/batch`, {
                organizations: reviewTasks,
                batchId: `review-${Date.now()}`,
                priority: 'medium'
            });
            
            console.log(`📋 Queued ${reviewTasks.length} organizations for Professor Lee's review`);
            
        } catch (error) {
            console.warn('⚠️ Failed to queue for human review:', error.message);
        }
        
        return reviewTasks;
    }

    /**
     * Handle low confidence organizations
     */
    async handleLowConfidence(organizations) {
        console.log(`⚠️ Handling ${organizations.length} low-confidence organizations...`);
        
        const handled = organizations.map(org => {
            // Determine action based on data quality
            let action = 'rejected';
            let reason = 'Low confidence and data quality';
            
            if (org.qualityScore > 0.5) {
                action = 'request_more_data';
                reason = 'Sufficient quality but low ML confidence - needs more data';
            } else if (org.name && org.website) {
                action = 'retry_processing';
                reason = 'Basic data available - retry with different processing methods';
            }
            
            return {
                ...org,
                action,
                reason,
                handledAt: new Date().toISOString(),
                suggestedReprocessing: action === 'retry_processing'
            };
        });
        
        return handled;
    }

    /**
     * Send feedback to ML system for continuous learning
     */
    async sendMLFeedback(results) {
        try {
            const feedbackData = {
                sessionId: this.feedbackLoop.sessionId,
                timestamp: new Date().toISOString(),
                feedback: {
                    auto_approved: results.autoApproved.map(org => ({
                        id: org.name,
                        confidence: org.combinedConfidence,
                        quality: org.qualityScore,
                        outcome: 'approved',
                        ml_accuracy: org.drLucy?.mlConfidence || 0
                    })),
                    human_review: results.humanReview.map(org => ({
                        id: org.name,
                        confidence: org.combinedConfidence,
                        quality: org.qualityScore,
                        outcome: 'needs_review',
                        ml_accuracy: org.drLucy?.mlConfidence || 0
                    })),
                    rejected: results.rejected.map(org => ({
                        id: org.name,
                        confidence: org.combinedConfidence,
                        quality: org.qualityScore,
                        outcome: 'rejected',
                        reason: org.reason,
                        ml_accuracy: org.drLucy?.mlConfidence || 0
                    }))
                },
                metrics: {
                    auto_approval_rate: results.autoApproved.length / (results.autoApproved.length + results.humanReview.length + results.rejected.length),
                    avg_ml_confidence: this.calculateAverageMLConfidence(results),
                    quality_gate_pass_rate: results.autoApproved.length / (results.autoApproved.length + results.rejected.length)
                }
            };
            
            const response = await axios.post(`${this.curationEndpoints.mlFeedbackLoop}/submit`, feedbackData);
            
            if (response.data?.status === 'received') {
                console.log(`📡 ML feedback sent: ${Object.values(feedbackData.feedback).flat().length} items`);
                return feedbackData.feedback;
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to send ML feedback:', error.message);
        }
        
        return [];
    }

    /**
     * Send quality feedback for failed items
     */
    async sendQualityFeedback(failedItems) {
        try {
            const qualityFeedback = {
                type: 'quality_gate_failures',
                timestamp: new Date().toISOString(),
                failures: failedItems.map(item => ({
                    id: item.name,
                    qualityScore: item.qualityScore,
                    failureReason: item.qualityFailureReason,
                    availableData: Object.keys(item).filter(key => 
                        !['name', 'qualityScore', 'qualityFailureReason'].includes(key) && item[key]
                    )
                }))
            };
            
            await axios.post(`${this.curationEndpoints.mlFeedbackLoop}/quality-feedback`, qualityFeedback);
            console.log(`🔍 Quality feedback sent for ${failedItems.length} failed items`);
            
        } catch (error) {
            console.warn('⚠️ Failed to send quality feedback:', error.message);
        }
    }

    /**
     * Calculate average ML confidence across results
     */
    calculateAverageMLConfidence(results) {
        const allItems = [
            ...results.autoApproved,
            ...results.humanReview,
            ...results.rejected
        ];
        
        const confidences = allItems.map(item => item.drLucy?.mlConfidence || 0).filter(c => c > 0);
        
        if (confidences.length === 0) return 0;
        
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    /**
     * Get curation system status
     */
    getCurationStatus() {
        return {
            system: 'professor_lee_curation',
            feedbackLoop: this.feedbackLoop,
            configuration: this.curationConfig,
            qualityGates: this.qualityGates,
            lastActivity: new Date().toISOString(),
            queueStatus: this.queueManager.getQueueStatus()
        };
    }

    /**
     * Manual feedback from Professor Lee
     */
    async submitManualFeedback(organizationId, feedback) {
        try {
            const manualFeedback = {
                organizationId,
                feedback,
                reviewer: 'professor_lee',
                timestamp: new Date().toISOString(),
                type: 'manual_review'
            };
            
            // Send to ML system for learning
            await axios.post(`${this.curationEndpoints.mlFeedbackLoop}/manual-feedback`, manualFeedback);
            
            console.log(`📝 Manual feedback submitted for ${organizationId}`);
            return manualFeedback;
            
        } catch (error) {
            console.error('❌ Failed to submit manual feedback:', error);
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        console.log('🧹 Cleaning up Professor Lee curation system...');
        
        if (this.queueManager && this.queueManager.shutdown) {
            await this.queueManager.shutdown();
        }
        
        console.log('✅ Professor Lee curation cleanup completed');
    }

    /**
     * Graceful shutdown method (calls cleanup for compatibility)
     */
    async shutdown() {
        console.log('🔄 Shutting down Professor Lee curation system...');
        await this.cleanup();
        console.log('✅ Professor Lee curation system shutdown completed');
    }
}

module.exports = { ProfessorLeeCurationSystem };
