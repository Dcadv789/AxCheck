import React, { useState, useEffect } from 'react';
import { Save, Upload, Pencil, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  email: string;
  fullName: string;
  position: string;
  phone: string;
}

function ProfileSettings() {
  const [userEmail, setUserEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    email: '',
    fullName: '',
    position: '',
    phone: ''
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setFormData(prev => ({ ...prev, email: user.email }));
      }
    };

    getUser();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsEditing(false);
      setLoading(false);
    }, 1000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(prev => ({ ...prev, email: userEmail }));
    setIsEditing(false);
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
  };

  return (
    <div>
      <div className="bg-zinc-900 rounded-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-white mb-3">Configurações do Perfil</h1>
        <p className="text-gray-400">Gerencie suas informações pessoais e preferências de conta.</p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-4xl font-medium text-white">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Foto do Perfil</h2>
                <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer transition-colors inline-block">
                  <Upload size={20} />
                  Fazer upload
                  <input type="file" className="hidden" accept="image/*" />
                </label>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">Informações Pessoais</h3>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <Pencil size={20} />
                  Editar
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    Salvar Alterações
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Digite seu cargo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </form>

          <div className="mt-12 pt-6 border-t border-zinc-800">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-white">Alterar Senha</h3>
                {!isEditingPassword ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingPassword(true)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    <Pencil size={20} />
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancelPassword}
                      className="text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Save size={20} />
                      )}
                      Salvar Senha
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={!isEditingPassword}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={!isEditingPassword}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!isEditingPassword}
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettings;