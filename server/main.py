from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal, engine
from models import Base, Order, Route, Vehicle, User
from order_manager import OrderManager
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import ast
import jwt
import bcrypt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
# from enum import Enum as PyEnum


Base.metadata.create_all(bind=engine)

# Create database session and seed initial data if empty
db = SessionLocal()
try:
    if db.query(Vehicle).count() == 0:
        print("Seeding initial vehicles...")
        vehicles = [
            Vehicle(capacity=50.0),
            Vehicle(capacity=80.0),
            Vehicle(capacity=100.0)
        ]
        db.add_all(vehicles)
        db.commit()
        
    if db.query(Order).count() == 0:
        print("Seeding initial orders...")
        orders = [
            Order(name="Order A", priority=1, weight=10.0, delivery_coordinates="19.125914,72.857195", order_datetime=datetime.now(), status="pending"),
            Order(name="Order B", priority=2, weight=15.0, delivery_coordinates="19.110758,72.868224", order_datetime=datetime.now(), status="pending"),
            Order(name="Order C", priority=1, weight=5.0, delivery_coordinates="19.102111,72.886025", order_datetime=datetime.now(), status="pending"),
            Order(name="Order D", priority=3, weight=25.0, delivery_coordinates="19.100309,72.903522", order_datetime=datetime.now(), status="pending"),
        ]
        db.add_all(orders)
        db.commit()
        
        # Trigger routing logic once initial orders are seeded
        try:
            manager = OrderManager(db)
            manager.assign_orders()
            print("Successfully assigned and routed initial orders!")
        except Exception as e:
            print(f"Error assigning initial orders: {e}")
except Exception as e:
    print(f"Error seeding database: {e}")
finally:
    db.close()


# Initialize the FastAPI app
app = FastAPI()

# Allow specific origins
origins = [
    "*",  # React frontend
    "http://localhost:3000/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specify allowed origins
    allow_credentials=True,  # Allow cookies and authentication headers
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all custom headers
)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SECRET_KEY = "SMARTROUTE_SUPER_SECRET_KEY"
ALGORITHM = "HS256"
security = HTTPBearer()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class UserRegister(BaseModel):
    username: str
    password: str
    role: Optional[str] = "dispatcher"

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    class Config:
        orm_mode = True

@app.post("/auth/signup")
def signup(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken")
    
    new_user = User(
        username=user.username,
        hashed_password=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": "User registered successfully!"}

@app.post("/auth/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    token = jwt.encode({"sub": user.username, "role": user.role}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}

@app.get("/auth/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


# Pydantic models to define the request/response schemas
class OrderCreate(BaseModel):
    name: str
    priority: int
    weight: float
    delivery_coordinates: str
    order_datetime: Optional[datetime] = None  # Make order_datetime optional as it will be auto-set
    status: Optional[str] = 'pending'
    delivery_distance: Optional[float] = None
    estimate_delivery_time: Optional[str] = None
    vehicle_id: Optional[int] = None
    route_id: Optional[int] = None

class OrderResponse(OrderCreate):
    id: int

    class Config:
        orm_mode = True



@app.post("/orders/", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    if order.weight <= 0:
        raise HTTPException(status_code=400, detail="Weight must be greater than 0")
    try:
        lat_str, lng_str = order.delivery_coordinates.split(",")
        lat = float(lat_str)
        lng = float(lng_str)
        if not (18.5 <= lat <= 19.5) or not (72.5 <= lng <= 73.5):
            raise HTTPException(status_code=400, detail="Coordinates must be in the Mumbai region (Lat: 18.5 to 19.5, Lng: 72.5 to 73.5)")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid coordinates format. Expected 'latitude,longitude'")

    # If order_datetime is not provided, use the current timestamp
    if order.order_datetime is None:
        order.order_datetime = datetime.now()

    db_order = Order(
        name=order.name,
        priority = order.priority,
        weight=order.weight,
        delivery_coordinates=order.delivery_coordinates,
        order_datetime=order.order_datetime,
        status=order.status,
        estimate_delivery_time=order.estimate_delivery_time,
        vehicle_id=order.vehicle_id,
        route_id=order.route_id
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Assign orders & compute optimal routes
    manager = OrderManager(db)
    manager.assign_orders()

    return db_order

@app.get("/orders/", response_model=List[OrderResponse])
def get_orders(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    orders = db.query(Order).offset(skip).limit(limit).all()
    return orders

@app.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

# Define request body model
class OrderRequest(BaseModel):
    order_ids: List[int]

@app.post("/orders_list/", response_model=List[OrderResponse])
def get_orders(order_request: OrderRequest, db: Session = Depends(get_db)):
    order_ids = order_request.order_ids

    # Fetch orders matching the given IDs
    orders = db.query(Order).filter(Order.id.in_(order_ids)).all()

    # Create a dictionary to maintain the order of requested IDs
    order_dict = {order.id: order for order in orders}

    # Check for missing order IDs
    missing_ids = [oid for oid in order_ids if oid not in order_dict]
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Orders not found for IDs: {missing_ids}")

    # Return orders in the same order as requested
    return [order_dict[oid] for oid in order_ids]

class VehicleCreate(BaseModel):
    capacity: float


class VehicleResponse(VehicleCreate):
    id: int

    class Config:
        orm_mode = True


@app.post("/vehicles/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    if vehicle.capacity <= 0:
        raise HTTPException(status_code=400, detail="Capacity must be greater than 0")

    db_vehicle = Vehicle(
        capacity=vehicle.capacity,
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.get("/vehicles/", response_model=List[VehicleResponse])
def get_vehicles(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).offset(skip).limit(limit).all()
    return vehicles

@app.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return db_vehicle



@app.get("/route/{vehicle_id}")
def get_route_by_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    # Fetch the order with the given vehicle_id
    order = db.query(Order).filter(Order.vehicle_id == vehicle_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="No orders found for this vehicle")
    
    # Fetch the associated route using order.route_id
    route = db.query(Route).filter(Route.id == order.route_id).first()
    
    if not route:
        raise HTTPException(status_code=404, detail="No route found for this vehicle's order")

    # Parse `full_route` into a proper list of lat/lng dictionaries
    try:
        parsed_full_route = eval(route.full_route)  # Assuming it's stored as a string representation of a list
        formatted_full_route = [{"lat": float(lat), "lng": float(lng)} for lat, lng in parsed_full_route]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing full_route: {str(e)}")
    
    return {
        "route_id": route.id,
        "assigned_orders": ast.literal_eval(route.assigned_orders),
        "route": route.route,
        "full_route": formatted_full_route,
        "vehicle_id": route.vehicle_id,
        "route_distance": route.route_distance
    }




@app.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Get total number of orders
    total_orders = db.query(Order).count()

    # Get count of pending orders
    pending_orders = db.query(Order).filter(Order.status == "pending").count()

    # Get total number of vehicles
    total_vehicles = db.query(Vehicle).count()

    # Get count of vehicles with orders having status 'in-process'
    vehicles_with_in_process_orders = (
        db.query(Vehicle)
        .join(Order, Vehicle.id == Order.vehicle_id)
        .filter(Order.status == "in-process")
        .distinct()
        .count()
    )

    routes = db.query(Route).all()
    total_distance = sum(r.route_distance for r in routes)

    orders = db.query(Order).all()
    total_weight = sum(o.weight for o in orders)
    assigned_weight = sum(o.weight for o in orders if o.status in ["in-process", "in-route"])

    vehicles = db.query(Vehicle).all()
    total_capacity = sum(v.capacity for v in vehicles)

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_vehicles": total_vehicles,
        "vehicles_with_in_process_orders": vehicles_with_in_process_orders,
        "total_distance": round(total_distance, 2),
        "total_weight": round(total_weight, 2),
        "assigned_weight": round(assigned_weight, 2),
        "total_capacity": round(total_capacity, 2)
    }

import re

class RecalculateRequest(BaseModel):
    traffic_level: Optional[str] = None
    weather_condition: Optional[str] = None

@app.post("/recalculate")
def recalculate_routes(req: RecalculateRequest, db: Session = Depends(get_db)):
    try:
        # Clear existing routes (nullify order route references first to prevent FK violation)
        db.query(Order).update({Order.route_id: None})
        db.commit()
        db.query(Route).delete()
        db.commit()
        
        # Reset order assignments
        for order in db.query(Order).all():
            order.status = "pending"
            order.vehicle_id = None
            order.route_id = None
            order.delivery_distance = None
            order.estimate_delivery_time = None
        db.commit()
        
        # Re-assign and compute routes with overrides
        manager = OrderManager(
            db, 
            override_traffic=req.traffic_level, 
            override_weather=req.weather_condition
        )
        manager.assign_orders()
        return {"status": "success", "message": "Routes successfully recalculated!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    message: str

@app.post("/chat-dispatch")
def chat_dispatch(req: ChatRequest, db: Session = Depends(get_db)):
    msg = req.message.lower().strip()
    
    # 1. Regex to Match: Add Order
    # E.g.: "add order named Client X with priority 2, weight 15 at 19.102, 72.868"
    add_order_match = re.search(
        r'(?:create|add|new)\s+order\s+(?:named\s+)?([a-zA-Z0-9_\-\s]+?)\s+(?:with\s+)?priority\s+(\d+)\s*,?\s*weight\s+(\d+(?:\.\d+)?)\s*,?\s*at\s+([0-9\.-]+)\s*,\s*([0-9\.-]+)',
        msg
    )
    if add_order_match:
        name = add_order_match.group(1).strip().title()
        priority = int(add_order_match.group(2))
        weight = float(add_order_match.group(3))
        lat = add_order_match.group(4).strip()
        lon = add_order_match.group(5).strip()
        coords = f"{lat},{lon}"

        try:
            latitude_val = float(lat)
            longitude_val = float(lon)
            if not (18.5 <= latitude_val <= 19.5) or not (72.5 <= longitude_val <= 73.5):
                return {
                    "response": f"🤖 **AI Dispatcher Console**:\n\n⚠️ **Validation Failed**: Coordinates `{lat}, {lon}` are outside the Mumbai Metropolitan Region (Lat: 18.5 to 19.5, Lng: 72.5 to 73.5). Order was not created.",
                    "status": "error"
                }
        except ValueError:
            return {
                "response": "🤖 **AI Dispatcher Console**:\n\n⚠️ **Validation Failed**: Invalid coordinate numbers. Order was not created.",
                "status": "error"
            }

        if weight <= 0:
            return {
                "response": "🤖 **AI Dispatcher Console**:\n\n⚠️ **Validation Failed**: Order weight must be greater than 0 kg. Order was not created.",
                "status": "error"
            }
        
        # Add to database
        db_order = Order(
            name=name,
            priority=priority,
            weight=weight,
            delivery_coordinates=coords,
            order_datetime=datetime.now(),
            status="pending"
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        # Recalculate
        manager = OrderManager(db)
        manager.assign_orders()
        
        # Find which vehicle was assigned
        db.refresh(db_order)
        assigned_text = f"assigned to Vehicle {db_order.vehicle_id}" if db_order.vehicle_id else "placed in the pending queue (insufficient vehicle capacity)"
        
        return {
            "response": f"🤖 **AI Dispatcher Console**:\n\nSuccessfully created **{name}**:\n- **Priority**: Level {priority}\n- **Weight**: {weight} kg\n- **Coordinates**: `{coords}`\n\nThe order has been {assigned_text} and routes have been optimized!",
            "status": "success"
        }
        
    # 2. Regex to Match: Add Vehicle
    # E.g.: "add vehicle with capacity 60"
    add_vehicle_match = re.search(
        r'(?:create|add|new)\s+vehicle\s+(?:with\s+)?capacity\s+(\d+(?:\.\d+)?)',
        msg
    )
    if add_vehicle_match:
        capacity = float(add_vehicle_match.group(1))

        if capacity <= 0:
            return {
                "response": "🤖 **AI Dispatcher Console**:\n\n⚠️ **Validation Failed**: Vehicle capacity must be greater than 0 kg. Vehicle was not registered.",
                "status": "error"
            }
        
        # Add to database
        db_vehicle = Vehicle(capacity=capacity)
        db.add(db_vehicle)
        db.commit()
        db.refresh(db_vehicle)
        
        # Recalculate routing
        manager = OrderManager(db)
        manager.assign_orders()
        
        return {
            "response": f"🤖 **AI Dispatcher Console**:\n\nSuccessfully deployed a new **Vehicle** (ID: {db_vehicle.id}) with a load capacity of **{capacity} kg**. Idle orders have been assigned and routed!",
            "status": "success"
        }
        
    # 3. Regex to Match: Recalculate Routes
    # E.g.: "optimize routes" or "recalculate"
    if any(keyword in msg for keyword in ["recalculate", "optimize", "reroute", "run tsp"]):
        manager = OrderManager(db)
        manager.assign_orders()
        return {
            "response": "🤖 **AI Dispatcher Console**:\n\nTriggered global Traveling Salesman Problem (TSP) optimization. All delivery routes and ETA predictions have been updated!",
            "status": "success"
        }
        
    # 4. Clear/Reset database
    if "reset" in msg or "clear" in msg:
        # Clear routes (nullify order route references first to prevent FK violation)
        db.query(Order).update({Order.route_id: None})
        db.commit()
        db.query(Route).delete()
        db.commit()
        # Reset orders to pending
        for order in db.query(Order).all():
            order.status = "pending"
            order.vehicle_id = None
            order.route_id = None
            order.delivery_distance = None
            order.estimate_delivery_time = None
        db.commit()
        manager = OrderManager(db)
        manager.assign_orders()
        return {
            "response": "🤖 **AI Dispatcher Console**:\n\nAll current vehicle assignments and routes have been cleared and recalculated to default state.",
            "status": "success"
        }

    # 5. Default Fallback Chat Response
    return {
        "response": (
            "🤖 **AI Dispatcher Console**:\n\n"
            "I couldn't parse that command. Here are some examples of what I can do:\n"
            "1. **Create Order**: `add order Client E with priority 1, weight 12 at 19.141, 72.842`\n"
            "2. **Add Vehicle**: `add vehicle with capacity 80`\n"
            "3. **Optimize**: `recalculate routes`\n"
            "4. **Reset**: `reset dashboard`"
        ),
        "status": "help"
    }

@app.delete("/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(db_order)
    db.commit()
    
    # Recalculate routes to update assignments
    try:
        manager = OrderManager(db)
        manager.assign_orders()
    except Exception as e:
        print(f"Error recalculating on delete: {e}")
        
    return {"status": "success", "message": f"Order {order_id} deleted successfully"}

@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Unassign orders mapped to this vehicle
    db.query(Order).filter(Order.vehicle_id == vehicle_id).update({
        "status": "pending",
        "vehicle_id": None,
        "route_id": None,
        "delivery_distance": None,
        "estimate_delivery_time": None
    })
    
    # Delete associated routes
    db.query(Route).filter(Route.vehicle_id == vehicle_id).delete()
    
    db.delete(db_vehicle)
    db.commit()
    
    # Recalculate routes to update assignments
    try:
        manager = OrderManager(db)
        manager.assign_orders()
    except Exception as e:
        print(f"Error recalculating on vehicle delete: {e}")
        
    return {"status": "success", "message": f"Vehicle {vehicle_id} deleted successfully"}


class AssignOrderRequest(BaseModel):
    vehicle_id: Optional[int] = None

@app.put("/orders/{order_id}/assign")
def assign_order_manually(order_id: int, req: AssignOrderRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if req.vehicle_id is None:
        # Unassign
        order.vehicle_id = None
        order.route_id = None
        order.status = "unassigned"
        order.delivery_distance = None
        order.estimate_delivery_time = None
    else:
        # Check if vehicle exists
        vehicle = db.query(Vehicle).filter(Vehicle.id == req.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        # Check capacity limits
        current_weight = sum(o.weight for o in vehicle.assigned_orders if o.id != order_id)
        if current_weight + order.weight > vehicle.capacity:
            raise HTTPException(status_code=400, detail=f"Capacity exceeded on Vehicle #{vehicle.id}. Max: {vehicle.capacity} kg, Current Load: {current_weight} kg, Order: {order.weight} kg")
        
        order.vehicle_id = vehicle.id
        order.status = "in-process"
    
    db.commit()
    
    # Recalculate routes to update order sequence and distance
    try:
        manager = OrderManager(db)
        manager.assign_orders()
    except Exception as e:
        print(f"Error recalculating on manual assign: {e}")
        
    return {"status": "success", "message": f"Order #{order_id} assigned successfully"}

@app.get("/auth/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "role": u.role} for u in users]

class UpdateRoleRequest(BaseModel):
    role: str

@app.put("/auth/users/{user_id}/role")
def update_user_role(user_id: int, req: UpdateRoleRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.role not in ["dispatcher", "manager", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = req.role
    db.commit()
    return {"status": "success", "message": "User role updated"}

@app.delete("/auth/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User deleted"}

@app.post("/admin/reset-db")
def reset_and_seed_db(db: Session = Depends(get_db)):
    try:
        # Delete orders, routes, vehicles in correct dependency order to prevent FK violations
        db.query(Order).delete()
        db.query(Route).delete()
        db.query(Vehicle).delete()
        db.commit()
        
        # Seed default vehicles
        vehicles = [
            Vehicle(capacity=50.0),
            Vehicle(capacity=80.0),
            Vehicle(capacity=100.0)
        ]
        db.add_all(vehicles)
        db.commit()
        
        # Seed default orders
        orders = [
            Order(name="Order A", priority=1, weight=10.0, delivery_coordinates="19.125914,72.857195", order_datetime=datetime.now(), status="pending"),
            Order(name="Order B", priority=2, weight=15.0, delivery_coordinates="19.110758,72.868224", order_datetime=datetime.now(), status="pending"),
            Order(name="Order C", priority=1, weight=5.0, delivery_coordinates="19.102111,72.886025", order_datetime=datetime.now(), status="pending"),
            Order(name="Order D", priority=3, weight=25.0, delivery_coordinates="19.100309,72.903522", order_datetime=datetime.now(), status="pending"),
        ]
        db.add_all(orders)
        db.commit()
        
        # Assign and route
        manager = OrderManager(db)
        manager.assign_orders()
        return {"status": "success", "message": "Database cleared and re-seeded successfully!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/diagnostics")
def system_diagnostics(db: Session = Depends(get_db)):
    try:
        import sys
        import os
        
        db_size = 0
        if os.path.exists("smartroute.db"):
            db_size = os.path.getsize("smartroute.db")
        
        db_type = "SQLite" if engine.name == "sqlite" else "PostgreSQL"
        return {
            "status": "healthy",
            "database": {
                "type": db_type,
                "size_bytes": db_size if engine.name == "sqlite" else 0,
                "users_count": db.query(User).count(),
                "orders_count": db.query(Order).count(),
                "vehicles_count": db.query(Vehicle).count(),
                "routes_count": db.query(Route).count(),
            },
            "environment": {
                "python_version": sys.version,
                "platform": sys.platform,
                "process_id": os.getpid()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DisruptionResponse(BaseModel):
    status: str
    message: str
    logs: List[str]

@app.post("/admin/simulate-disruption", response_model=DisruptionResponse)
def simulate_disruption(db: Session = Depends(get_db)):
    try:
        # Find all routes
        active_routes = db.query(Route).all()
        if not active_routes:
            # Auto-assign if empty to make sure we have routes
            manager = OrderManager(db)
            manager.assign_orders()
            active_routes = db.query(Route).all()
            
        if not active_routes:
            raise HTTPException(status_code=400, detail="No active routes to disrupt. Please add vehicles and orders first.")
            
        # Select the first route/vehicle
        disrupted_route = active_routes[0]
        vehicle_id = disrupted_route.vehicle_id
        
        # Get orders assigned to this vehicle
        orders = db.query(Order).filter(Order.vehicle_id == vehicle_id).all()
        order_names = [o.name for o in orders]
        
        if not orders:
            raise HTTPException(status_code=400, detail="Selected vehicle has no assigned orders.")
            
        # 1. Reset orders on this vehicle to pending
        for o in orders:
            o.vehicle_id = None
            o.status = "pending"
            o.route_id = None
        db.commit()
        
        # 2. Delete the route for this vehicle
        db.query(Route).filter(Route.vehicle_id == vehicle_id).delete()
        db.commit()
        
        # 3. Simulate breakdown by setting capacity to 0 temporarily
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        old_capacity = vehicle.capacity
        vehicle.capacity = 0.0
        db.commit()
        
        # 4. Re-assign orders (orders from broken-down vehicle will be routed to others)
        manager = OrderManager(db)
        manager.assign_orders()
        
        # 5. Restore original capacity for future tasks
        vehicle.capacity = old_capacity
        db.commit()
        
        logs = [
            f"🚨 [TelemetryAgent]: CRITICAL: Engine cooling fault detected on Vehicle #{vehicle_id}.",
            f"🧠 [DiagnosticAgent]: High temperature alarm (118°C). Shutting down engine to prevent thermal seizure.",
            f"🛰️ [LocatorAgent]: Vehicle #{vehicle_id} parked safely. Status: Offline / Disabled.",
            f"📦 [InventoryAgent]: Flagged stranded orders: {', '.join(order_names)}.",
            f"🧩 [OrchestratorAgent]: Triggering automated disruption-recovery protocol.",
            f"🔄 [RoutingAgent]: Evacuating orders {', '.join(order_names)} from Vehicle #{vehicle_id}.",
            f"🧠 [SolverAgent]: Solving TSP routing paths for remaining active vehicles...",
            f"🚚 [RoutingAgent]: Stranded orders successfully reallocated to other active trucks.",
            f"✅ [DispatchAgent]: Recovery completed. Dispatches updated successfully."
        ]
        
        return {
            "status": "success",
            "message": f"Successfully simulated breakdown on Vehicle #{vehicle_id}.",
            "logs": logs
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))




