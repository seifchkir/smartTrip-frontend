import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface DayPlan {
    dayNumber: number;
    activities: string[];
    accommodation?: string;
    locations?: string[];
}

export interface SavedTrip {
    _id?: string;
    userId: string;
    title?: string;
    destination?: string;
    budget?: number;
    detailedBudget?: { [key: string]: number };
    duration?: number;
    createdAt: string;
    dayPlans: DayPlan[];
    highlights?: string[];
    originalQuery?: string;
    rawRecommendationData?: string;
}

export interface ProcessAndSaveTripRequest {
    userId: string;
    markdown_recommendation: string;
    original_query?: string;
    title?: string;
}

export interface SaveTripResponse {
    message: string;
    saved_trip_id: string;
}

class TripService {
    // Method to get user ID from local storage
    private getUserIdFromLocalStorage(): string | null {
        const userProfileString = localStorage.getItem('userProfile');
        if (!userProfileString) {
            console.warn('getUserIdFromLocalStorage: userProfile not found in localStorage');
            // Try to get from auth_token as fallback
            const authToken = localStorage.getItem('auth_token');
            if (authToken) {
                try {
                    const payload = JSON.parse(atob(authToken.split('.')[1]));
                    const userIdFromToken = payload.sub || payload.userId || payload.email;
                    if (userIdFromToken) {
                        console.log('Using user ID from auth_token:', userIdFromToken);
                        return userIdFromToken;
                    }
                } catch (error) {
                    console.error('Error parsing auth_token:', error);
                }
            }
            return null;
        }

        try {
            const userProfile = JSON.parse(userProfileString);
            if (userProfile?.id) {
                return userProfile.id;
            } else if (userProfile?.userId) {
                return userProfile.userId;
            } else if (userProfile?.email) {
                return userProfile.email;
            }
            console.warn('No valid user ID found in userProfile');
            return null;
        } catch (error) {
            console.error('Error parsing userProfile:', error);
            return null;
        }
    }

    // Save a new trip
    async saveTrip(
        markdownRecommendation: string,
        originalQuery: string,
        title: string
    ): Promise<SaveTripResponse> {
        const userId = this.getUserIdFromLocalStorage();
        if (!userId) {
            throw new Error('Please log in to save trips');
        }

        if (!title?.trim()) {
            throw new Error('Please enter a title for your trip');
        }

        if (!markdownRecommendation?.trim()) {
            throw new Error('No trip recommendation to save');
        }

        const request: ProcessAndSaveTripRequest = {
            userId,
            markdown_recommendation: markdownRecommendation,
            original_query: originalQuery,
            title: title.trim()
        };

        try {
            const response = await axios.post<SaveTripResponse>(
                `${API_URL}/process-and-save-trip`,
                request
            );
            return response.data;
        } catch (error: any) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.detail || error.message;
                throw new Error(`Failed to save trip: ${errorMessage}`);
            }
            throw new Error('An unexpected error occurred while saving the trip');
        }
    }

    // Method to get user's saved trips (for the second endpoint later)
    async getUserTrips(userId: string): Promise<SavedTrip[]> {
        try {
            const response = await axios.get<SavedTrip[]>(`${API_URL}/user/${userId}/trips`);
            return response.data;
        } catch (error: any) {
             if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.detail || error.message;
                throw new Error(`Failed to fetch user trips: ${errorMessage}`);
            }
            throw new Error('An unexpected error occurred while fetching user trips');
        }
    }
}

export const tripService = new TripService();
