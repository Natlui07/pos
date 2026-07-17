import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Nfc, UserPlus, Shield } from 'lucide-react';
import { toast } from 'sonner';

const roleLabels = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  gerente: 'Gerente',
  mesero: 'Mesero',
  cajero: 'Cajero',
};

const roleColors = {
  superadmin: 'bg-purple-500/10 text-purple-600 border-purple-200',
  admin: 'bg-blue-500/10 text-blue-600 border-blue-200',
  gerente: 'bg-green-500/10 text-green-600 border-green-200',
  mesero: 'bg-orange-500/10 text-orange-600 border-orange-200',
  cajero: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('mesero');
  const [nfcId, setNfcId] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editNfc, setEditNfc] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      toast.success('Usuario actualizado');
    },
  });

  const handleInvite = async () => {
    await base44.users.inviteUser(inviteEmail, inviteRole === 'superadmin' || inviteRole === 'admin' ? 'admin' : 'user');
    toast.success(`Invitación enviada a ${inviteEmail}`);
    setShowInvite(false);
    setInviteEmail('');
    setInviteRole('mesero');
  };

  const handleSaveEdit = () => {
    updateUserMutation.mutate({
      id: editUser.id,
      data: {
        role: editRole,
        nfc_card_id: editNfc,
        phone: editPhone,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground text-sm">Gestión de empleados y permisos</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invitar Usuario
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>NFC</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || 'Sin nombre'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[u.role] || ''}>
                      <Shield className="w-3 h-3 mr-1" />
                      {roleLabels[u.role] || u.role || 'Sin rol'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.nfc_card_id ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        <Nfc className="w-3 h-3 mr-1" />{u.nfc_card_id}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">No asignada</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{u.phone || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditUser(u);
                      setEditRole(u.role || 'mesero');
                      setEditNfc(u.nfc_card_id || '');
                      setEditPhone(u.phone || '');
                    }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="correo@ejemplo.com" type="email" />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Super Administrador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="mesero">Mesero</SelectItem>
                  <SelectItem value="cajero">Cajero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail}>Enviar Invitación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario - {editUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Super Administrador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="mesero">Mesero</SelectItem>
                  <SelectItem value="cajero">Cajero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID Tarjeta NFC</Label>
              <div className="relative">
                <Nfc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={editNfc} onChange={e => setEditNfc(e.target.value)} placeholder="Escanear o ingresar ID NFC" className="pl-10" />
              </div>
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}