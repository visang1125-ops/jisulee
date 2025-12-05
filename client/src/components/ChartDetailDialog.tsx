import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ChartDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: Array<Record<string, any>>;
  columns: Array<{ key: string; label: string; format?: (value: unknown) => string }>;
}

export default function ChartDetailDialog({ 
  open, 
  onOpenChange, 
  title, 
  data, 
  columns 
}: ChartDetailDialogProps) {
  const handleExportCSV = () => {
    const headers = columns.map(col => col.label);
    const rows = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        return col.format ? col.format(value) : String(value ?? "");
      })
    );

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{title} 상세 정보</DialogTitle>
              <DialogDescription className="mt-1">
                {data.length}개 항목
              </DialogDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              className="gap-2 min-h-[44px]"
              aria-label="CSV 다운로드"
            >
              <Download className="h-4 w-4" />
              CSV 다운로드
            </Button>
          </div>
        </DialogHeader>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.format ? col.format(item[col.key]) : String(item[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

