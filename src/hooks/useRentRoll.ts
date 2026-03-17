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

export function useSaveMapping(dealId: string) {
  return useMutation({
    mutationFn: (p: { rentRollId: string; mapping: Record<string, string> }) =>
      rentRollCaptureApi.saveMapping(dealId, p.rentRollId, p.mapping),
  });
}

export function useFloorplans(dealId: string, rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-floorplans", rentRollId],
    queryFn: () => rentRollCaptureApi.getFloorplans(dealId, rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useUpdateFloorplans(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { rentRollId: string; floorplans: FloorplanRow[] }) =>
      rentRollCaptureApi.updateFloorplans(dealId, p.rentRollId, p.floorplans),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["rent-roll-floorplans", v.rentRollId] }),
  });
}

export function useOccupancy(dealId: string, rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-occupancy", rentRollId],
    queryFn: () => rentRollCaptureApi.getOccupancy(dealId, rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useUpdateOccupancy(dealId: string) {
  return useMutation({
    mutationFn: (p: { rentRollId: string; occupancy: OccupancyRow[] }) =>
      rentRollCaptureApi.updateOccupancy(dealId, p.rentRollId, p.occupancy),
  });
}

export function useCharges(dealId: string, rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-charges", rentRollId],
    queryFn: () => rentRollCaptureApi.getCharges(dealId, rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useUpdateCharges(dealId: string) {
  return useMutation({
    mutationFn: (p: { rentRollId: string; charges: ChargeRow[] }) =>
      rentRollCaptureApi.updateCharges(dealId, p.rentRollId, p.charges),
  });
}

export function useUpdateRenovations(dealId: string) {
  return useMutation({
    mutationFn: (p: { rentRollId: string; renovations: { floor_plan_code: string; renovation_description: string }[] }) =>
      rentRollCaptureApi.updateRenovations(dealId, p.rentRollId, p.renovations),
  });
}

export function useUpdateAffordability(dealId: string) {
  return useMutation({
    mutationFn: (p: { rentRollId: string; hasAffordable: boolean; leaseTypes?: { floor_plan_code: string; lease_type: string }[] }) =>
      rentRollCaptureApi.updateAffordability(dealId, p.rentRollId, p.hasAffordable, p.leaseTypes),
  });
}

export function useFinalizeRentRoll(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rentRollId: string) => rentRollCaptureApi.finalize(dealId, rentRollId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rent-rolls"] }),
  });
}

export function useDeleteRentRoll(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rentRollId: string) => rentRollCaptureApi.delete(dealId, rentRollId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rent-rolls"] }),
  });
}

export function useRentRollDashboard(dealId: string, rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-dashboard", rentRollId],
    queryFn: () => rentRollCaptureApi.getDashboard(dealId, rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useRentRollUnitsDetailed(dealId: string, rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-units-detailed", rentRollId],
    queryFn: () => rentRollCaptureApi.getUnits(dealId, rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useFloorPlanSummary(dealId: string, rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-fp-summary", rentRollId],
    queryFn: () => rentRollCaptureApi.getFloorPlanSummary(dealId, rentRollId!),
    enabled: !!rentRollId,
  });
}

export function useRentRollAnomalies(dealId: string, rentRollId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-anomalies", rentRollId],
    queryFn: () => rentRollCaptureApi.getAnomalies(dealId, rentRollId!),
    enabled: !!rentRollId,
  });
}
