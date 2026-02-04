import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  plan: string;
}

interface UserSearchComboboxProps {
  value: string | null;
  onSelect: (userId: string | null, userInfo?: User) => void;
  disabled?: boolean;
}

export function UserSearchCombobox({ value, onSelect, disabled }: UserSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-search', search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_users');
      if (error) throw error;
      return data as User[];
    },
    staleTime: 30000,
  });

  const filteredUsers = users?.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const selectedUser = users?.find(u => u.user_id === value);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedUser ? (
              <div className="flex items-center gap-2 truncate">
                <span className="truncate">
                  {selectedUser.full_name || selectedUser.email}
                </span>
                <Badge variant={selectedUser.plan === 'pro' ? 'default' : 'secondary'} className="text-xs">
                  {selectedUser.plan}
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar usuário...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Digite email ou nome..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : filteredUsers.length === 0 ? (
                <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
              ) : (
                <CommandGroup heading={`${filteredUsers.length} usuário(s)`}>
                  {filteredUsers.slice(0, 50).map((user) => (
                    <CommandItem
                      key={user.user_id}
                      value={user.user_id}
                      onSelect={() => {
                        onSelect(user.user_id, user);
                        setOpen(false);
                        setSearch('');
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user.full_name || 'Sem nome'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'} className="text-xs">
                          {user.plan}
                        </Badge>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === user.user_id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null)}
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
