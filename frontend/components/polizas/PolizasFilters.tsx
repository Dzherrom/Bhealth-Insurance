import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, Save, RotateCcw, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { PolizaFilters } from './types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PolizasFiltersProps {
  filters: PolizaFilters;
  onFiltersChange: (filters: PolizaFilters) => void;
  uniqueStatuses?: string[];
  uniquePlans?: string[];
  uniqueAgents?: string[];
}

export function PolizasFilters({
  filters,
  onFiltersChange,
  uniqueStatuses = [],
  uniquePlans = [],
  uniqueAgents = [],
}: PolizasFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PolizaFilters>(filters);
  const [savedFiltersLists, setSavedFiltersLists] = useState<{name: string, filter: PolizaFilters}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('polizasSavedFilters');
    if (saved) {
      try { setSavedFiltersLists(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const updateLocalFilter = (key: keyof PolizaFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const defaultFilters: PolizaFilters = {
      search: '',
      status: 'all',
      plan: 'all',
      agente: 'all',
      user: 'all',
      groupOfUsers: 'all',
      assignedTo: 'all',
      role: 'all',
      referredByAgency: 'all',
      referredToAgency: 'all',
      state: 'all',
      zipCode: '',
      carrier: 'all',
      memberId: 'all',
      productType: 'all',
      documentsStatus: 'all',
      paymentStatus: 'all',
      saleType: 'all',
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleSaveFilter = () => {
    const name = window.prompt("Name your saved filter:");
    if (name) {
      const newList = [...savedFiltersLists, { name, filter: localFilters }];
      setSavedFiltersLists(newList);
      localStorage.setItem('polizasSavedFilters', JSON.stringify(newList));
    }
  };

  const applySavedFilter = (savedFilter: PolizaFilters) => {
    setLocalFilters(savedFilter);
    onFiltersChange(savedFilter);
  };

  const removeSavedFilter = (index: number) => {
    const newList = [...savedFiltersLists];
    newList.splice(index, 1);
    setSavedFiltersLists(newList);
    localStorage.setItem('polizasSavedFilters', JSON.stringify(newList));
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4 flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, client or agent..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto sm:max-w-[500px]">
            <SheetHeader>
              <SheetTitle>Filter your policies by</SheetTitle>
            </SheetHeader>
            
            <Tabs defaultValue="filters" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="saved">Saved filters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="filters" className="space-y-6 mt-4">
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={applyFilters} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                    <Search className="w-4 h-4 mr-2" /> Search
                  </Button>
                  <Button variant="ghost" onClick={resetFilters} className="text-indigo-500 hover:text-indigo-600">
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset filters
                  </Button>
                  <Button variant="ghost" onClick={handleSaveFilter} className="text-indigo-500 hover:text-indigo-600">
                    <Save className="w-4 h-4 mr-2" /> Save filter
                  </Button>
                </div>

                <div className="space-y-4 pb-12">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">User</Label>
                    <Select value={localFilters.user || 'all'} onValueChange={(v) => updateLocalFilter('user', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by user" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by user</SelectItem>
                        {uniqueAgents.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Group of users</Label>
                    <Select value={localFilters.groupOfUsers || 'all'} onValueChange={(v) => updateLocalFilter('groupOfUsers', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by Group of users" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by Group of users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Assigned to</Label>
                    <Select value={localFilters.assignedTo || 'all'} onValueChange={(v) => updateLocalFilter('assignedTo', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by assigned user" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by assigned user</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Role</Label>
                    <Select value={localFilters.role || 'all'} onValueChange={(v) => updateLocalFilter('role', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by role</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Referred by agency</Label>
                    <Select value={localFilters.referredByAgency || 'all'} onValueChange={(v) => updateLocalFilter('referredByAgency', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by agency" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Referred to agency</Label>
                    <Select value={localFilters.referredToAgency || 'all'} onValueChange={(v) => updateLocalFilter('referredToAgency', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by agency" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">State</Label>
                    <Select value={localFilters.state || 'all'} onValueChange={(v) => updateLocalFilter('state', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by state" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by state</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Zip code</Label>
                    <Input 
                      placeholder="Filter by Zip code" 
                      value={localFilters.zipCode || ''}
                      onChange={(e) => updateLocalFilter('zipCode', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Carrier</Label>
                    <Select value={localFilters.carrier || 'all'} onValueChange={(v) => updateLocalFilter('carrier', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by carrier" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by carrier</SelectItem>
                        {uniquePlans.map(plan => (
                          <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Member ID</Label>
                    <Select value={localFilters.memberId || 'all'} onValueChange={(v) => updateLocalFilter('memberId', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by member ID" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by member ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Product type</Label>
                    <Select value={localFilters.productType || 'all'} onValueChange={(v) => updateLocalFilter('productType', v)}>
                      <SelectTrigger><SelectValue placeholder="Product type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Product type</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="dental">Dental</SelectItem>
                        <SelectItem value="vision">Vision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Policy status</Label>
                    <Select value={localFilters.status || 'all'} onValueChange={(v) => updateLocalFilter('status', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by policy status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by policy status</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Documents status</Label>
                    <Select value={localFilters.documentsStatus || 'all'} onValueChange={(v) => updateLocalFilter('documentsStatus', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by documents status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by documents status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Payment status</Label>
                    <Select value={localFilters.paymentStatus || 'all'} onValueChange={(v) => updateLocalFilter('paymentStatus', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by payment status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by payment status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold uppercase">Sale type</Label>
                    <Select value={localFilters.saleType || 'all'} onValueChange={(v) => updateLocalFilter('saleType', v)}>
                      <SelectTrigger><SelectValue placeholder="Filter by sale type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Filter by sale type</SelectItem>
                        <SelectItem value="NUEVA">Nueva Venta</SelectItem>
                        <SelectItem value="RENOVACION">Renovación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              </TabsContent>
              
              <TabsContent value="saved">
                <div className="mt-4 space-y-3">
                  {savedFiltersLists.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      You have not saved any filters yet.
                    </div>
                  ) : (
                    savedFiltersLists.map((saved, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="font-medium text-sm">{saved.name}</div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => applySavedFilter(saved.filter)}>
                            Apply
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeSavedFilter(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
