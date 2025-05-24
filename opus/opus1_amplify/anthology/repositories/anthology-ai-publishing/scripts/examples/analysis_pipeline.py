"""Analysis Pipeline Examples"""
from typing import Dict
from scripts.uailc_processor import UAILCProcessor
from scripts.document_processor import AIDocumentProcessor

class AnalysisPipeline:
    def __init__(self):
        self.uailc = UAILCProcessor('api-for-warp-drive')
        self.doc_processor = AIDocumentProcessor('api-for-warp-drive')
        
    def analyze_org(
        self,
        org_data: Dict,
        focus: str,
        depth: str
    ) -> Dict:
        """Run organizational analysis"""
        # Process documents
        doc_analysis = self.doc_processor.process_document(
            content=org_data,
            focus=focus
        )
        
        # Get AI insights
        ai_analysis = self.doc_processor.get_ai_analysis(
            data=doc_analysis,
            models=['claude', 'vertex']
        )
        
        # Run through UAILC
        uailc_results = self.uailc.process_data(
            analysis=ai_analysis,
            depth=depth
        )
        
        return {
            'document_analysis': doc_analysis,
            'ai_insights': ai_analysis,
            'uailc_results': uailc_results
        }