import React from 'react';
import { User, Mail, Camera } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';

interface UserData {
  name: string;
  email: string;
  avatar: string;
}

function Configuracoes() {
  const [userData, setUserData] = useLocalStorage<UserData>('user_data', {
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData({ ...userData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div className="bg-zinc-900 rounded-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-white mb-3">Configurações</h1>
        <p className="text-gray-400">Gerencie suas informações pessoais e preferências do sistema.</p>
      </div>

      <div className="bg-zinc-900 rounded-lg p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <Camera className="text-white" size={24} />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{userData.name}</h2>
                <p className="text-gray-400">{userData.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="block w-full pl-10 bg-zinc-800 border border-zinc-700 rounded-lg py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className="block w-full pl-10 bg-zinc-800 border border-zinc-700 rounded-lg py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;