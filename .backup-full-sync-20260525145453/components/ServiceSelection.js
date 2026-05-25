// components/ServiceSelection.js - Versión femenina

function ServiceSelection({ onSelect, selectedService }) {
    const [services, setServices] = React.useState([]);
    const [cargando, setCargando] = React.useState(true);

    React.useEffect(() => {
        cargarServicios();
        
        const handleActualizacion = () => cargarServicios();
        window.addEventListener('serviciosActualizados', handleActualizacion);
        
        return () => {
            window.removeEventListener('serviciosActualizados', handleActualizacion);
        };
    }, []);

    const cargarServicios = async () => {
        setCargando(true);
        try {
            console.log('📋 Cargando servicios...');
            if (window.salonServicios) {
                const serviciosActivos = await window.salonServicios.getAll(true);
                console.log('✅ Servicios obtenidos:', serviciosActivos);
                setServices(serviciosActivos || []);
            }
        } catch (error) {
            console.error('Error cargando servicios:', error);
            setServices([]);
        } finally {
            setCargando(false);
        }
    };

    if (cargando) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                    <span className="text-2xl">💫</span>
                    1. Elegí tu servicio
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-purple-600 rounded-full mx-auto"></div>
                    <p className="text-purple-500 mt-4">Cargando servicios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                <span className="text-2xl">💫</span>
                1. Elegí tu servicio
                {selectedService && (
                    <span className="text-xs bg-purple-200 text-pink-700 px-2 py-1 rounded-full ml-2">
                        ✓ Seleccionado
                    </span>
                )}
            </h2>
            
            {services.length === 0 ? (
                <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-300">
                    <p className="text-purple-600">No hay servicios disponibles</p>
                    <p className="text-xs text-purple-500 mt-2">La administradora debe cargar servicios primero</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {services.map(service => (
                        <button
                            key={service.id}
                            onClick={() => onSelect(service)}
                            className={`
                                p-4 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-[1.02]
                                ${selectedService?.id === service.id 
                                    ? 'border-purple-600 bg-purple-100 ring-2 ring-purple-400 shadow-md' 
                                    : 'border-purple-300 bg-white/80 backdrop-blur-sm hover:border-purple-500 hover:bg-purple-100/50 hover:shadow-sm'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">
                                            {service.nombre.toLowerCase().includes('corte') ? '✂️' : 
                                             service.nombre.toLowerCase().includes('uña') ? '💫' :
                                             service.nombre.toLowerCase().includes('peinado') ? '💇‍♀️' :
                                             service.nombre.toLowerCase().includes('maquillaje') ? '💄' : '✨'}
                                        </span>
                                        <span className="font-medium text-pink-800 text-lg block">
                                            {service.nombre}
                                        </span>
                                    </div>
                                    {service.descripcion && (
                                        <p className="text-sm text-purple-700/70 mt-1 ml-8">{service.descripcion}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-4">
                                    <span className="text-purple-700 font-bold text-lg">
                                        ${service.precio}
                                    </span>
                                    <span className="flex items-center text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded-full border border-purple-300">
                                        <span className="mr-1">⏱️</span>
                                        {service.duracion} min
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}