"""Room management endpoints (persistent room definitions; live presence is
handled by the realtime service in Phase 2)."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomRead, RoomWithOccupancy
from app.services import presence

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomRead, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreate, current_user: CurrentUser, db: DbSession
) -> Room:
    room = Room(
        name=payload.name,
        capacity=payload.capacity,
        is_public=payload.is_public,
        owner_id=current_user.id,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room


@router.get("", response_model=list[RoomWithOccupancy])
async def list_rooms(
    current_user: CurrentUser, db: DbSession
) -> list[RoomWithOccupancy]:
    """Public rooms plus any room owned by the caller, with live occupancy
    from Redis presence so the directory shows which rooms are awake."""
    result = await db.execute(
        select(Room)
        .where((Room.is_public.is_(True)) | (Room.owner_id == current_user.id))
        .order_by(Room.created_at.desc())
    )
    rooms = list(result.scalars().all())
    return [
        RoomWithOccupancy(
            **RoomRead.model_validate(room).model_dump(),
            occupancy=await presence.member_count(str(room.id)),
        )
        for room in rooms
    ]


@router.get("/{room_id}", response_model=RoomRead)
async def get_room(room_id: UUID, current_user: CurrentUser, db: DbSession) -> Room:
    room = await db.get(Room, room_id)
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    return room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: UUID, current_user: CurrentUser, db: DbSession
) -> None:
    room = await db.get(Room, room_id)
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    if room.owner_id != current_user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only the owner can delete this room"
        )
    await db.delete(room)
    await db.commit()
