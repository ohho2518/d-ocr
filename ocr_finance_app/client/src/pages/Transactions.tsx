import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Transactions() {
  const [editData, setEditData] = useState<any>({});
  const { data: transactions, isLoading, refetch } = trpc.transactions.list.useQuery({});
  const updateMutation = trpc.transactions.update.useMutation();
  const deleteMutation = trpc.transactions.delete.useMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Deleted');
      refetch();
    } catch (error) {
      toast.error('Error');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen grid-bg py-8">
      <div className="container">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen grid-bg py-8">
      <div className="container">
        <h1 className="text-4xl font-black mb-8">Transactions</h1>
        <Card className="wireframe-cyan overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary/10 border-b-2 border-dashed border-primary">
                <tr>
                  <th className="px-6 py-4 text-left label-mono font-black">Date</th>
                  <th className="px-6 py-4 text-left label-mono font-black">Description</th>
                  <th className="px-6 py-4 text-right label-mono font-black">Amount</th>
                  <th className="px-6 py-4 text-center label-mono font-black">Type</th>
                  <th className="px-6 py-4 text-center label-mono font-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((tx) => (
                  <tr key={tx.id} className="border-b border-border hover:bg-primary/5">
                    <td className="px-6 py-4 data-mono text-sm">
                      {new Date(tx.date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 data-mono text-sm">{tx.description}</td>
                    <td className="px-6 py-4 data-mono text-sm text-right">
                      ฿{parseFloat(tx.amount.toString()).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-black px-2 py-1 rounded ${tx.type === 'income' ? 'bg-primary/20' : 'bg-secondary/20'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
