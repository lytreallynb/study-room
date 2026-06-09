"""A/B experiment + feature-flag schemas."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ExperimentCreate(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    variants: list[str] = Field(default=["control", "treatment"], min_length=2)


class ExperimentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str
    name: str
    variants: list[str]
    active: bool


class AssignmentRead(BaseModel):
    experiment_key: str
    variant: str


class MetricCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=80)
    value: float = 1.0


class VariantResult(BaseModel):
    variant: str
    exposures: int
    completions: int
    completion_rate: float


class FlagUpsert(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    enabled: bool = True
    rollout_pct: int = Field(default=100, ge=0, le=100)


class FlagState(BaseModel):
    key: str
    enabled: bool
