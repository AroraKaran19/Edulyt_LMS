export interface AuthenticationMedia {
  _id: string;
  imageUrl: string;
  order: number;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuthenticationMediaData {
  imageUrl: string;
  order: number;
  link?: string;
}

export interface UpdateAuthenticationMediaData {
  imageUrl?: string;
  order?: number;
  link?: string;
}

