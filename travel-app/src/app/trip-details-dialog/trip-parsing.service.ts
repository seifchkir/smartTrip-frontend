import { Injectable } from '@angular/core';

export interface ParsedTripPlan {
  destinationName: string;
  destinationImage: string; // Note: Image generation might still be component-specific or moved here
  badges: { label: string, icon: string, color: string }[];
  itineraryDays: { title: string; steps: string[] }[]; // Structure matching what dialog template expects
  highlights: string[]; // Highlights array
  detailedBudget: { [key: string]: number }; // Detailed budget object
  rawRecommendationString?: string; // Keep the raw string
  originalQuery?: string; // Keep the original query
  title?: string; // Keep the title
}

@Injectable({
  providedIn: 'root'
})
export class TripParsingService {

  constructor() { }

  parseRawRecommendation(rawRecommendation: any, originalQuery?: string, title?: string): ParsedTripPlan {
    // Handle cases where rawRecommendation is not a string or is missing
    if (typeof rawRecommendation !== 'string' || !rawRecommendation.trim()) {
        console.warn('TripParsingService: Raw recommendation is not a valid string or is empty.', rawRecommendation);
         // Return a basic structure if parsing fails
        return {
            destinationName: 'Untitled Trip',
            destinationImage: 'https://source.unsplash.com/800x300/?travel', // Default image
            badges: [],
            itineraryDays: [],
            highlights: [],
            detailedBudget: {},
            rawRecommendationString: rawRecommendation,
            originalQuery: originalQuery,
            title: title
        };
    }

    // Use the existing parsing logic from home.component.ts
    const parsedData: Partial<ParsedTripPlan> = {};

    // --- Extract Destination Name (Adapt from home.component) ---
     // This might need the raw string or extracted_info if available
     // For now, a placeholder or attempt basic extraction
     // Attempt to extract destination from the Overview section
     const overviewMatch = rawRecommendation.match(/## Overview\s*\n([\s\S]*?)(?:\n##|$)/i);
     let extractedDestination = title || 'Your Destination'; // Default to title

     if (overviewMatch && overviewMatch[1]) {
         // Look for phrases like 'to the high-end destination of Monaco' or just 'to Monaco'
         const destinationPhraseMatch = overviewMatch[1].match(/to the.*?destination of\s*(.*?)(?:\.|,)|to\s+([A-Z][a-zA-Z\s-]+?)(?:\.|,)/i);
         if (destinationPhraseMatch && (destinationPhraseMatch[1] || destinationPhraseMatch[2])) {
             extractedDestination = (destinationPhraseMatch[1] || destinationPhraseMatch[2]).trim();
         } else {
             // Fallback: try to find a capitalized word/phrase in the first sentence
             const firstSentenceMatch = overviewMatch[1].match(/^[^\.\n]*?\b([A-Z][a-zA-Z\s-]+?(?:\s[A-Z][a-zA-Z\s]*)*?)(?:\.|,|$)/);
              if (firstSentenceMatch && firstSentenceMatch[1]) {
                   extractedDestination = firstSentenceMatch[1].trim();
              }
         }
     }
     // Clean and capitalize the extracted destination
     parsedData.destinationName = this.capitalize(extractedDestination.replace(/principality|destination|city|town|area|region/gi, '').trim());

    // --- Generate Destination Image (Adapt from home.component) ---
    // This is often component-specific or needs external logic. Keeping a simple placeholder for now.
     parsedData.destinationImage = 'https://source.unsplash.com/800x300/?' + encodeURIComponent(parsedData.destinationName || 'travel');

    // --- Parse Itinerary (Adapt from home.component.parseItinerary) ---
    parsedData.itineraryDays = this.parseItinerary(rawRecommendation);

    // --- Parse Highlights (Adapt from home.component or use the new highlights array from SavedTrip) ---
     // If the raw markdown contains a ## Highlights section, parse it.
     const highlightsMatch = rawRecommendation.match(/## Highlights\s*\n([\s\S]*?)(?:\n##|$)/i);
     if (highlightsMatch && highlightsMatch[1]) {
        parsedData.highlights = highlightsMatch[1].split('\n')
            .map(h => h.trim())
            .filter(h => h.startsWith('-') || h.startsWith('*') || h.startsWith('•')) // Filter list items
            .map(h => h.substring(1).trim()); // Remove list marker
     } else {
         parsedData.highlights = []; // Default to empty if no highlights section is found
     }

    // --- Parse Budget Breakdown (Adapt from home.component or use detailedBudget from SavedTrip) ---
     // If the raw markdown contains a ## Budget Breakdown section, parse it.
     const budgetMatch = rawRecommendation.match(/## Budget Breakdown\s*\n([\s\S]*?)(?:\n##|$)/i);
     if (budgetMatch && budgetMatch[1]) {
         parsedData.detailedBudget = this.parseBudget(budgetMatch[1]);
     } else {
         parsedData.detailedBudget = {}; // Default to empty if no budget section is found
     }

    // --- Badges (Adapt from home.component) ---
     // This might require extracted_info, which is not directly in the raw markdown string.
     // For now, badges might be best handled by components based on available parsed data (duration, budget, theme if extractable).
    parsedData.badges = []; // Placeholder - component might populate this based on parsed data

    parsedData.rawRecommendationString = rawRecommendation;
    parsedData.originalQuery = originalQuery;
    parsedData.title = title;

    return parsedData as ParsedTripPlan; // Cast to the full type
  }

  private parseItinerary(recommendation: string): { title: string; steps: string[] }[] {
    const days: { title: string; steps: string[] }[] = [];

    console.log('parseItinerary: Input recommendation string:', recommendation);

    if (typeof recommendation !== 'string') {
        console.warn('TripParsingService: Non-string recommendation for itinerary parsing.', recommendation);
        return days;
    }

    // Try to find day patterns in the text
    // This regex tries to capture the Day X line and the content until the next Day X or end.
    const dayPattern = /^(###\s*Day\s*\d+.*)\s*\n((?:[^\n]+\n?)*?)(?=\n###\s*Day\s*\d+|\n##\s*.*|$)/gmi;

    let match;
    let dayIndex = 0; // Use a counter for day numbers if not in markdown

    while ((match = dayPattern.exec(recommendation)) !== null) {
        console.log('parseItinerary: Regex match found:', match);
        const dayTitleMatch = match[1].trim();
        const dayContent = match[2].trim();

        console.log('parseItinerary: Extracted dayTitleMatch:', dayTitleMatch);
        console.log('parseItinerary: Extracted dayContent:', dayContent);

        // Log the result of the steps splitting
        // Split content by newline, trim each line, and filter out empty lines
        console.log('parseItinerary: dayContent BEFORE split:', dayContent);
        const splitLines = dayContent.split('\n');
        console.log('parseItinerary: dayContent AFTER split(\n):', splitLines);

        const steps = splitLines
            .map(line => line.trim())
            .filter(line => line.length > 0);

        console.log('parseItinerary: Steps after splitting and filtering (re-added log): ', steps);

        // Extract day number and title from the matched title string
        const dayNumberMatch = dayTitleMatch.match(/\d+/);
        const dayNum = dayNumberMatch ? parseInt(dayNumberMatch[0]) : (dayIndex + 1);

        days.push({
            title: `Day ${dayNum}`, // Use extracted or generated day number
            steps: steps // Each step is a raw markdown string part
        });

        dayIndex++;
    }

     // Fallback for simple lists or single block of text if no clear day patterns found
     if (days.length === 0 && recommendation.trim().length > 0) {
          const simpleSteps = recommendation
             .split(/\n\s*[\-\*•]\s*|\n{2,}/) // Split by list markers or double newlines
             .map(s => s.trim())
             .filter(s => s && s.length > 0);
          if (simpleSteps.length > 0) {
               days.push({
                   title: 'Day 1', // Assume a single day if no markers
                   steps: simpleSteps
               });
          }
     }

    console.log('parseItinerary: Final days array:', days);
    return days;
  }

   private parseBudget(budgetMarkdown: string): { [key: string]: number } {
       const detailedBudget: { [key: string]: number } = {};
       const budgetLines = budgetMarkdown.split('\n')
           .map(line => line.trim())
           .filter(line => line && line.includes(':'));

       for (const line of budgetLines) {
           const [categoryPart, amountPart] = line.split(':');
           // Clean the category name: remove leading markdown (-, *, •, **) and trailing colon/space
           const cleanedCategory = categoryPart.replace(/^[-\s*•]+|\*{2,}|:\s*$/g, '').trim();
           // Clean and parse the amount: remove non-numeric characters except decimal point
           // Clean the amount string: remove commas and dollar signs, allow digits and decimal point
           const cleanedAmountString = amountPart.replace(/,/g, '').replace(/\$/g, '').trim();
           const amount = parseFloat(cleanedAmountString) || 0;

           if (cleanedCategory) {
               detailedBudget[cleanedCategory] = amount;
           }
       }
       return detailedBudget;
    }

  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
