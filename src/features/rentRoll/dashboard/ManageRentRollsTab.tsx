import { Button } from "@/components/ui/button";

export function ManageRentRollsTab({ rentRollId }: { rentRollId: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Manage Rent Rolls</h3>
      <div className="border rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current Rent Roll</p>
            <p className="text-xs text-muted-foreground mt-0.5">ID: {rentRollId}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Export to Excel</Button>
            <Button variant="outline" size="sm">Report Settings</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
