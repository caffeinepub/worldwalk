import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Building {
    size: Pos3D;
    position: Pos3D;
}
export interface Road {
    id: bigint;
    name: string;
    path: Array<Pos3D>;
}
export interface Character {
    principal: Principal;
    name: string;
    color: string;
}
export interface World {
    worldGeom: [Array<Building>, Array<Road>];
    locationName: string;
}
export interface UserProfile {
    name: string;
    color: string;
}
export interface Pos3D {
    x: number;
    y: number;
    z: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createWorld(locationName: string, buildings: Array<Building>, roads: Array<Road>): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPlayerPosition(player: Principal): Promise<[Pos3D, number, Character]>;
    getPlayers(): Promise<Array<[Pos3D, number, Character]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorld(): Promise<World | null>;
    isCallerAdmin(): Promise<boolean>;
    joinWorld(character: Character, position: Pos3D, rotationYaw: number): Promise<void>;
    leaveWorld(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePosition(new_pos: Pos3D, yaw: number): Promise<void>;
}
