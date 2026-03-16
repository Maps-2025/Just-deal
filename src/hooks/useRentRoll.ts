import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rentRollCaptureApi } from "@/services/rentRollApi";
import type { FloorplanRow, OccupancyRow, ChargeRow } from "@/services/rentRollApi";

export function useRentRollList(dealId: string | undefined) {
  return useQuery({
    queryKey: ["rent-rolls", dealId],
    queryFn: () => rentRollCaptureApi.list(dealId!),
    enabled: !!dealId,
  });
}

export function useUploadRentRoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { dealId: string; file: File; totalUnits: number; reportDate?: string }) =>
      rentRollCaptureApi.upload(p.dealId, p.file, p.totalUnits, p.reportDate),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["rent-rolls", v.dealId] }),
  });
}

export function useSaveMapping() {
  return useMutation({
    mutationFn: (p: { rentRollId: string; mapping: Record<string, string> }) =>
      rentRollCaptureApi.saveMapping(p.rentRollId, p.mapping),
  });
}

export function useFloorplans(rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-floorplans", rentRollId],
    queryFn: () => rentRollCaptureApi.getFloorplans(rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useUpdateFloorplans() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { rentRollId: string; floorplans: FloorplanRow[] }) =>
      rentRollCaptureApi.updateFloorplans(p.rentRollId, p.floorplans),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["rent-roll-floorplans", v.rentRollId] }),
  });
}

export function useOccupancy(rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-occupancy", rentRollId],
    queryFn: () => rentRollCaptureApi.getOccupancy(rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useUpdateOccupancy() {
  return useMutation({
    mutationFn: (p: { rentRollId: string; occupancy: OccupancyRow[] }) =>
      rentRollCaptureApi.updateOccupancy(p.rentRollId, p.occupancy),
  });
}

export function useCharges(rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-charges", rentRollId],
    queryFn: () => rentRollCaptureApi.getCharges(rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useUpdateCharges() {
  return useMutation({
    mutationFn: (p: { rentRollId: string; charges: ChargeRow[] }) =>
      rentRollCaptureApi.updateCharges(p.rentRollId, p.charges),
  });
}

export function useUpdateRenovations() {
  return useMutation({
    mutationFn: (p: { rentRollId: string; renovations: { floor_plan_code: string; renovation_description: string }[] }) =>
      rentRollCaptureApi.updateRenovations(p.rentRollId, p.renovations),
  });
}

export function useUpdateAffordability() {
  return useMutation({
    mutationFn: (p: { rentRollId: string; hasAffordable: boolean; leaseTypes?: { floor_plan_code: string; lease_type: string }[] }) =>
      rentRollCaptureApi.updateAffordability(p.rentRollId, p.hasAffordable, p.leaseTypes),
  });
}

export function useFinalizeRentRoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rentRollId: string) => rentRollCaptureApi.finalize(rentRollId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rent-rolls"] }),
  });
}

export function useDeleteRentRoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rentRollId: string) => rentRollCaptureApi.delete(rentRollId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rent-rolls"] }),
  });
}

export function useRentRollDashboard(rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-dashboard", rentRollId],
    queryFn: () => rentRollCaptureApi.getDashboard(rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useRentRollUnitsDetailed(rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-units-detailed", rentRollId],
    queryFn: () => rentRollCaptureApi.getUnits(rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useFloorPlanSummary(rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-fp-summary", rentRollId],
    queryFn: () => rentRollCaptureApi.getFloorPlanSummary(rentRollId!),
    enabled: !!rentRollId,
  });
}
