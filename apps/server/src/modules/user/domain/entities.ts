export interface UserEntity {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  };
}
