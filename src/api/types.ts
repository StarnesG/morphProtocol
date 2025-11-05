export interface SubTrafficRequest {
  id: string;
  traffic: number;
}

export interface ClientNumRequest {
  name: string;
}

export interface UpdateServerInfoRequest {
  name: string;
  ip: string;
  port: string;
  info: string;
  status: string;
}
