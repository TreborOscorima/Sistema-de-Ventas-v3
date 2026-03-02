import { useCompany, Branch } from "@/contexts/CompanyContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function BranchSelector() {
  const { branches, activeBranch, setActiveBranch } = useCompany();

  if (branches.length <= 1) return null;

  return (
    <Select
      value={activeBranch?.id || ""}
      onValueChange={(value) => {
        const branch = branches.find((b) => b.id === value);
        if (branch) setActiveBranch(branch);
      }}
    >
      <SelectTrigger className="w-[200px] gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <SelectValue placeholder="Seleccionar sucursal" />
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
