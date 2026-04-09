// components/LashistaSelector.js - Versión con filtro por servicio

function LashistaSelector({ onSelect, selectedLashista, selectedService }) {
    const [Lashistaes, setLashistaes] = React.useState([]);
    const [cargando, setCargando] = React.useState(true);
    const [todosLashistaes, setTodosLashistaes] = React.useState([]);

    React.useEffect(() => {
        cargarTodosLashistaes();
    }, []);

    React.useEffect(() => {
        if (todosLashistaes.length > 0) {
            filtrarPorServicio();
        }
    }, [selectedService, todosLashistaes]);

    const cargarTodosLashistaes = async () => {
        setCargando(true);
        try {
            if (window.salonLashistaes) {
                const activos = await window.salonLashistaes.getAll(true);
                setTodosLashistaes(activos || []);
                filtrarPorServicio(activos || []);
            }
        } catch (error) {
            console.error('Error cargando Lashistaes:', error);
        } finally {
            setCargando(false);
        }
    };

    const filtrarPorServicio = async (LashistaesList = todosLashistaes) => {
        if (!selectedService) {
            setLashistaes(LashistaesList);
            return;
        }

        try {
            console.log(`🔍 Filtrando Lashistaes para servicio: ${selectedService.nombre}`);
            
            if (window.getLashistaesPorServicio) {
                const LashistaesDelServicio = await window.getLashistaesPorServicio(selectedService.id);
                const idsDelServicio = LashistaesDelServicio.map(p => p.id);
                
                console.log(`📋 Lashistaes asignados a este servicio:`, idsDelServicio);
                
                const filtrados = LashistaesList.filter(p => idsDelServicio.includes(p.id));
                setLashistaes(filtrados);
                
                if (selectedLashista && !filtrados.find(p => p.id === selectedLashista.id)) {
                    console.log('⚠️ Lashista seleccionado ya no disponible para este servicio');
                    onSelect(null);
                }
            } else {
                setLashistaes(LashistaesList);
            }
        } catch (error) {
            console.error('Error filtrando Lashistaes:', error);
            setLashistaes(LashistaesList);
        }
    };

    if (cargando) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                    <span className="text-2xl">👁️</span>
                    2. Elegí tu Lashista
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-purple-600 rounded-full mx-auto"></div>
                    <p className="text-purple-500 mt-4">Cargando Lashistaes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                <span className="text-2xl">👁️</span>
                2. Elegí tu Lashista
                {selectedLashista && (
                    <span className="text-xs bg-purple-200 text-pink-700 px-2 py-1 rounded-full ml-2">
                        ✓ Seleccionada
                    </span>
                )}
            </h2>
            
            {selectedService && Lashistaes.length === 0 ? (
                <div className="text-center p-8 bg-purple-100 rounded-xl border border-purple-300">
                    <div className="text-5xl text-purple-600 mb-3">👥❌</div>
                    <p className="text-pink-700 font-medium">
                        No hay Lashistaes disponibles para "{selectedService.nombre}"
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                        El administrador debe asignar Lashistaes a este servicio
                    </p>
                </div>
            ) : Lashistaes.length === 0 ? (
                <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-300">
                    <p className="text-purple-600">No hay Lashistaes disponibles</p>
                </div>
            ) : (
                <>
                    {selectedService && (
                        <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded-lg border border-purple-300">
                            💡 Mostrando solo Lashistaes que realizan "{selectedService.nombre}"
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Lashistaes.map(prof => (
                            <button
                                key={prof.id}
                                onClick={() => onSelect(prof)}
                                className={`
                                    p-4 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105
                                    ${selectedLashista?.id === prof.id 
                                        ? 'border-purple-600 bg-purple-100 ring-2 ring-purple-400 shadow-lg' 
                                        : 'border-purple-300 bg-white/80 backdrop-blur-sm hover:border-purple-500 hover:bg-purple-100/50 hover:shadow-md'}
                                `}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 ${prof.color || 'bg-purple-600'} rounded-full flex items-center justify-center text-3xl mb-3 shadow-md ring-2 ring-purple-400/50`}>
                                        {prof.avatar || '👁️'}
                                    </div>
                                    <span className="font-bold text-pink-800 text-lg block">
                                        {prof.nombre}
                                    </span>
                                    <span className="text-sm text-purple-600 mt-1">
                                        {prof.especialidad}
                                    </span>
                                    
                                    {selectedLashista?.id === prof.id && (
                                        <div className="mt-2 text-purple-700 text-sm font-semibold flex items-center gap-1">
                                            <span>✅</span>
                                            Seleccionada
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
            
            <div className="text-xs text-purple-600 bg-purple-100 p-3 rounded-lg border border-purple-300">
                <p className="flex items-center gap-2">
                    <span className="text-purple-500 text-lg">💡</span>
                    <span>Cada Lashista tiene su propia agenda. Después de elegir, podrás ver sus horarios disponibles.</span>
                </p>
            </div>
        </div>
    );
}