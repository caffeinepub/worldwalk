import Map "mo:core/Map";
import Blob "mo:core/Blob";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile System
  public type UserProfile = {
    name : Text;
    color : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // WorldWalk Game Logic
  module Pos3D {
    public func compare(pos1 : Pos3D, pos2 : Pos3D) : Order.Order {
      switch (Float.compare(pos1.x, pos2.x)) {
        case (#equal) {
          switch (Float.compare(pos1.y, pos2.y)) {
            case (#equal) { Float.compare(pos1.z, pos2.z) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  module Character {
    public func compare(char1 : Character, char2 : Character) : Order.Order {
      switch (Text.compare(char1.name, char2.name)) {
        case (#equal) { Text.compare(char1.color, char2.color) };
        case (order) { order };
      };
    };
  };

  module Building {
    public func compare(b1 : Building, b2 : Building) : Order.Order {
      switch (Pos3D.compare(b1.position, b2.position)) {
        case (#equal) { Pos3D.compare(b1.size, b2.size) };
        case (order) { order };
      };
    };
  };

  module Road {
    public func compare(road1 : Road, road2 : Road) : Order.Order {
      switch (Int.compare(road1.id, road2.id)) {
        case (#equal) { Text.compare(road1.name, road2.name) };
        case (order) { order };
      };
    };
  };

  module World {
    public func compare(world1 : World, world2 : World) : Order.Order {
      Text.compare(world1.locationName, world2.locationName);
    };
  };

  type Pos3D = { x : Float; y : Float; z : Float };
  type Character = { name : Text; color : Text; principal : Principal };
  type Building = { position : Pos3D; size : Pos3D };
  type Road = { path : [Pos3D]; name : Text; id : Int };
  type World = { locationName : Text; worldGeom : ([Building], [Road]) };
  var currentWorld : ?World = null;

  type PlayerState = {
    position : Pos3D;
    rotationYaw : Float;
    lastUpdate : Time.Time;
    character : Character;
  };

  let players = Map.empty<Principal, PlayerState>();
  let staleThreshold : Time.Time = 30_000_000_000;

  func cleanStalePlayers() {
    let currentTime = Time.now();
    let active = players.filter(func(_, p) { currentTime - p.lastUpdate < staleThreshold });
    players.clear();
    active.forEach(func(p, s) { players.add(p, s) });
  };

  public shared ({ caller }) func createWorld(locationName : Text, buildings : [Building], roads : [Road]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create worlds");
    };
    let world : World = {
      locationName;
      worldGeom = (buildings, roads);
    };
    currentWorld := ?world;
    players.clear();
  };

  public query func getWorld() : async ?World {
    currentWorld;
  };

  public shared ({ caller }) func joinWorld(character : Character, position : Pos3D, rotationYaw : Float) : async () {
    cleanStalePlayers();
    players.add(caller, { character; position; rotationYaw; lastUpdate = Time.now() });
  };

  public shared ({ caller }) func updatePosition(new_pos : Pos3D, yaw : Float) : async () {
    let state = switch (players.get(caller)) {
      case (null) { Runtime.trap("Cannot update position if not joined.") };
      case (?s) { s };
    };
    players.add(caller, { state with position = new_pos; rotationYaw = yaw; lastUpdate = Time.now() });
  };

  public shared ({ caller }) func leaveWorld() : async () {
    let _ = switch (players.get(caller)) {
      case (null) { return () };
      case (?_) { () };
    };
    players.remove(caller);
  };

  public query func getPlayers() : async [(Pos3D, Float, Character)] {
    players.values().toArray().map(func(state) { (state.position, state.rotationYaw, state.character) });
  };

  public query ({ caller }) func getPlayerPosition(player : Principal) : async (Pos3D, Float, Character) {
    switch (players.get(player)) {
      case (null) { Runtime.trap("Player not found in world") };
      case (?state) { (state.position, state.rotationYaw, state.character) };
    };
  };
};
