package com.quakemind.feature.map

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import android.os.Looper
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.quakemind.core.data.repository.MapRepository
import com.quakemind.core.model.GeoPoint
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout
import javax.inject.Inject
import kotlin.coroutines.resume

private data class LocationState(
    val location: GeoPoint? = null,
    val accuracyMetres: Float? = null,
    val isLocating: Boolean = false,
    val isRefreshingPoints: Boolean = false,
    val locationError: String? = null,
    val pointsError: String? = null,
)

@HiltViewModel
class MapViewModel @Inject constructor(
    private val mapRepository: MapRepository,
    @ApplicationContext private val context: Context,
) : ViewModel() {
    private val locationState = MutableStateFlow(LocationState())

    val state: StateFlow<MapUiState> = combine(mapRepository.mapPoints(), locationState) { points, location ->
        MapUiState(
            mapPoints = if (location.pointsError == null && !location.isRefreshingPoints) points else emptyList(),
            deviceLocation = location.location,
            accuracyMetres = location.accuracyMetres,
            isLocating = location.isLocating,
            isRefreshingPoints = location.isRefreshingPoints,
            locationError = location.locationError,
            pointsError = location.pointsError,
        )
    }.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        MapUiState(mapPoints = mapRepository.currentMapPoints()),
    )

    fun locationPermissionDenied() {
        locationState.update {
            it.copy(location = null, accuracyMetres = null, isLocating = false,
                locationError = "Konum izni verilmedi. Yakındaki noktalar için izin gerekiyor.")
        }
    }

    fun refreshDeviceLocation() {
        if (locationState.value.isLocating || locationState.value.isRefreshingPoints) return
        viewModelScope.launch {
            locationState.update {
                it.copy(isLocating = true, locationError = null, pointsError = null,
                    location = null, accuracyMetres = null)
            }
            try {
                val fix = withTimeout(20_000) { getCurrentDeviceLocation() }
                    ?: throw IllegalStateException("Konum sağlayıcısı konum gönderemedi.")
                val age = System.currentTimeMillis() - fix.time
                if (age !in 0..120_000L || !fix.latitude.isFinite() ||
                    !fix.longitude.isFinite() || fix.latitude !in -90.0..90.0 ||
                    fix.longitude !in -180.0..180.0
                ) {
                    throw IllegalStateException("Güncel ve geçerli bir konum alınamadı.")
                }
                val coordinates = GeoPoint(fix.latitude, fix.longitude)
                locationState.update {
                    it.copy(location = coordinates,
                        accuracyMetres = if (fix.hasAccuracy()) fix.accuracy else null,
                        isLocating = false, isRefreshingPoints = true)
                }
                try {
                    mapRepository.refresh(coordinates)
                    locationState.update { it.copy(pointsError = null) }
                } catch (cancel: CancellationException) {
                    throw cancel
                } catch (_: Exception) {
                    locationState.update {
                        it.copy(pointsError = "Yakındaki yerler sunucudan alınamadı. Bağlantınızı kontrol ederek tekrar deneyin.")
                    }
                } finally {
                    locationState.update { it.copy(isRefreshingPoints = false) }
                }
            } catch (cancel: CancellationException) {
                locationState.update { it.copy(isLocating = false, isRefreshingPoints = false) }
                throw cancel
            } catch (_: Exception) {
                locationState.update {
                    it.copy(isLocating = false, isRefreshingPoints = false,
                        locationError = "Cihaz konumu alınamadı. Konum iznini ve GPS ayarlarını kontrol edin.")
                }
            }
        }
    }

    @SuppressLint("MissingPermission")
    private suspend fun getCurrentDeviceLocation(): Location? {
        val fine = context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarse = context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (!fine && !coarse) throw SecurityException("Konum izni yok.")

        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val provider = when {
            fine && manager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
            manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
            else -> throw IllegalStateException("Konum servisi kapalı.")
        }
        return suspendCancellableCoroutine { continuation ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val cancellation = CancellationSignal()
                continuation.invokeOnCancellation { cancellation.cancel() }
                manager.getCurrentLocation(provider, cancellation, context.mainExecutor) { fix ->
                    if (continuation.isActive) continuation.resume(fix)
                }
            } else {
                val listener = object : LocationListener {
                    override fun onLocationChanged(location: Location) {
                        manager.removeUpdates(this)
                        if (continuation.isActive) continuation.resume(location)
                    }
                    override fun onProviderDisabled(provider: String) {
                        manager.removeUpdates(this)
                        if (continuation.isActive) continuation.resume(null)
                    }
                }
                continuation.invokeOnCancellation { manager.removeUpdates(listener) }
                manager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
            }
        }
    }
}
