package com.quakemind.feature.map

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.MyLocation
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.quakemind.core.designsystem.AfetCrimson
import com.quakemind.core.designsystem.Zinc200
import com.quakemind.core.designsystem.Zinc400
import com.quakemind.core.designsystem.Zinc500
import com.quakemind.core.designsystem.Zinc700
import com.quakemind.core.designsystem.Zinc950
import com.quakemind.core.model.GeoPoint
import com.quakemind.core.model.MapPoint
import com.quakemind.core.model.MapPointType
import com.quakemind.core.ui.state.AppUiState
import android.location.Location
import java.util.Locale
import kotlin.math.abs

private val mapFilters = listOf("Tümü", "Toplanma Alanı", "Yakındakiler", "Sağlık", "Eczane", "İtfaiye", "Polis")
private const val nearbyRadiusMeters = 5_000f

/** An honest coordinate listing: roads and walking routes require a real map data source. */
@Composable
fun MapScreen(state: AppUiState, onIncident: (String) -> Unit) {
    MapScreen(state = MapUiState(mapPoints = state.mapPoints), onIncident = onIncident)
}

@Composable
fun MapScreen(
    state: MapUiState,
    onIncident: (String) -> Unit,
    onRequestLocation: (() -> Unit)? = null,
) {
    val context = LocalContext.current
    var selectedFilter by rememberSaveable { mutableStateOf("Tümü") }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var selectedPointId by rememberSaveable { mutableStateOf<String?>(null) }

    // Latitude/longitude are only rendered if within physical geographic bounds.
    val validPoints = remember(state.mapPoints) { state.mapPoints.filter(::isValidCoordinate) }
    val filteredPoints = remember(validPoints, state.deviceLocation, selectedFilter, searchQuery) {
        validPoints.filter { point ->
            val categoryMatches = when (selectedFilter) {
                "Toplanma Alanı" -> point.type == MapPointType.ASSEMBLY_AREA
                "Sağlık" -> point.type == MapPointType.SAHRA_HOSPITAL || point.type == MapPointType.HEALTH_FACILITY
                "Eczane" -> point.type == MapPointType.PHARMACY
                "İtfaiye" -> point.type == MapPointType.FIRE_STATION
                "Polis" -> point.type == MapPointType.POLICE_STATION
                "Yakındakiler" -> state.deviceLocation?.let { distanceMetres(it, point) <= nearbyRadiusMeters } ?: false
                else -> true
            }
            categoryMatches && (searchQuery.isBlank() ||
                point.title.contains(searchQuery.trim(), ignoreCase = true) ||
                point.address.contains(searchQuery.trim(), ignoreCase = true))
        }.let { points ->
            state.deviceLocation?.let { location -> points.sortedBy { distanceMetres(location, it) } }
                ?: points.sortedBy { it.title }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F4F5))
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        androidx.compose.foundation.layout.Spacer(Modifier.height(8.dp))
        Text("Konum noktaları", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Zinc950)
        Text(
            "Koordinatlar kayıtlardaki konumları gösterir. Yol, geçiş güvenliği veya tahliye güzergâhı gösterilmez.",
            fontSize = 12.sp,
            color = Zinc700,
        )

        Surface(
            color = Color.White,
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, Zinc200),
        ) {
            Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Outlined.MyLocation, contentDescription = null, tint = AfetCrimson, modifier = Modifier.size(19.dp))
                    Text("Cihaz konumu", fontWeight = FontWeight.SemiBold, color = Zinc950, modifier = Modifier.weight(1f))
                    OutlinedButton(
                        onClick = { onRequestLocation?.invoke() },
                        enabled = onRequestLocation != null && !state.isLocating,
                    ) {
                        Text(if (state.isLocating) "Konum alınıyor" else "Konumumu al", fontSize = 12.sp)
                    }
                }
                val currentLocation = state.deviceLocation
                Text(
                    if (currentLocation != null) {
                        "${coordinateLabel(currentLocation.latitude, currentLocation.longitude)}" +
                            (state.accuracyMetres?.let { " · Yaklaşık ±${it.toInt()} m doğruluk" } ?: "")
                    } else {
                        "Konum paylaşılmadı. Yakınlık hesabı için cihaz konumunu alın."
                    },
                    fontSize = 12.sp,
                    color = Zinc700,
                )
                state.locationError?.let { Text(it, fontSize = 12.sp, color = AfetCrimson) }
                state.pointsError?.let { Text(it, fontSize = 12.sp, color = AfetCrimson) }
                if (state.isRefreshingPoints) {
                    Text("Yakındaki yerler sorgulanıyor...", fontSize = 12.sp, color = Zinc700)
                }
            }
        }

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
            label = { Text("Kayıtlarda ad veya adres ara") },
        )

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(
                items = mapFilters,
                key = { it },
                contentType = { "map_filter" },
            ) { filter ->
                FilterChip(
                    selected = selectedFilter == filter,
                    onClick = { selectedFilter = filter },
                    label = { Text(filter, fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = AfetCrimson,
                        selectedLabelColor = Color.White,
                    ),
                )
            }
        }

        Text(
            "${filteredPoints.size} konum kaydı" + if (selectedFilter == "Yakındakiler") " · 5 km, kuş uçuşu" else "",
            fontSize = 12.sp,
            color = Zinc500,
        )

        if (filteredPoints.isEmpty()) {
            Surface(
                modifier = Modifier.fillMaxWidth().testTag("map_empty_state"),
                color = Color.White,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Zinc200),
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(Icons.Outlined.Place, contentDescription = null, tint = Zinc400, modifier = Modifier.size(32.dp))
                    Text(
                        when {
                            state.isRefreshingPoints -> "Yakındaki yerler yükleniyor"
                            state.pointsError != null -> "Yakındaki yerler yüklenemedi"
                            validPoints.isEmpty() -> "Harita konum verisi bulunmuyor"
                            selectedFilter == "Yakındakiler" && state.deviceLocation == null -> "Yakındaki noktalar için konum gerekli"
                            else -> "Eşleşen konum bulunamadı"
                        },
                        fontWeight = FontWeight.SemiBold,
                        color = Zinc950,
                    )
                    Text(
                        when {
                            state.isRefreshingPoints -> "Cihaz konumunuza göre sunucudan veri bekleniyor."
                            state.pointsError != null -> "Tekrar sorgulamak için Konumumu al düğmesini kullanabilirsiniz."
                            validPoints.isEmpty() -> "Konumunuzu alarak sunucudaki yakın yerleri sorgulayabilirsiniz. Veri gelene kadar harita veya yol çizilmiyor."
                            selectedFilter == "Yakındakiler" && state.deviceLocation == null -> "Konum izni vererek 5 km içindeki kayıtları listeleyebilirsiniz."
                            else -> "Arama metnini veya kategori filtresini değiştirebilirsiniz."
                        },
                        fontSize = 12.sp,
                        color = Zinc500,
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f).testTag("map_points_list"),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 24.dp),
            ) {
                items(
                    items = filteredPoints,
                    key = { it.id },
                    contentType = { "map_point" },
                ) { point ->
                    val distance = state.deviceLocation?.let { distanceMetres(it, point) }
                    val isSelected = selectedPointId == point.id
                    Surface(
                        modifier = Modifier.fillMaxWidth().clickable {
                            selectedPointId = if (isSelected) null else point.id
                        }.testTag("map_point_card"),
                        color = Color.White,
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, if (isSelected) AfetCrimson else Zinc200),
                    ) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Outlined.LocationOn, contentDescription = null, tint = AfetCrimson, modifier = Modifier.size(18.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(point.title, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Zinc950)
                                    Text(pointTypeLabel(point.type), fontSize = 11.sp, color = Zinc500)
                                }
                                if (distance != null) {
                                    Text(formatDistance(distance), fontSize = 12.sp, color = Zinc700)
                                }
                            }
                            if (point.address.isNotBlank()) {
                                Text(point.address, fontSize = 12.sp, color = Zinc700, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            }
                            Text(coordinateLabel(point.latitude, point.longitude), fontSize = 12.sp, color = Zinc700)
                            if (isSelected) {
                                if (point.statusText.isNotBlank()) {
                                    Text("Kaynakta bildirilen durum: ${point.statusText}", fontSize = 12.sp, color = Zinc700)
                                }
                                point.capacity?.takeIf { it.isNotBlank() }?.let {
                                    Text("Bildirilen kapasite: $it", fontSize = 12.sp, color = Zinc700)
                                }
                                Text("Mesafe kuş uçuşudur. Yol veya ulaşılabilirlik doğrulanmış değildir.", fontSize = 11.sp, color = Zinc500)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = {
                                            val uri = Uri.parse("geo:0,0?q=${point.latitude},${point.longitude}")
                                            try {
                                                context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                                            } catch (_: ActivityNotFoundException) {
                                                Toast.makeText(context, "Harita uygulaması bulunamadı.", Toast.LENGTH_SHORT).show()
                                            } catch (_: SecurityException) {
                                                Toast.makeText(context, "Harita uygulaması açılamadı.", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = AfetCrimson),
                                    ) { Text("Konumu haritada aç", fontSize = 12.sp) }
                                    if (point.type == MapPointType.INCIDENT) {
                                        OutlinedButton(onClick = { onIncident(point.id) }) {
                                            Text("İhbarı aç", fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun isValidCoordinate(point: MapPoint): Boolean =
    point.latitude.isFinite() && point.longitude.isFinite() &&
        point.latitude in -90.0..90.0 && point.longitude in -180.0..180.0

private fun distanceMetres(origin: GeoPoint, point: MapPoint): Float {
    val result = FloatArray(1)
    Location.distanceBetween(origin.latitude, origin.longitude, point.latitude, point.longitude, result)
    return result[0]
}

private fun coordinateLabel(latitude: Double, longitude: Double): String =
    String.format(
        Locale.US,
        "%.5f° %s, %.5f° %s",
        abs(latitude), if (latitude >= 0) "K" else "G",
        abs(longitude), if (longitude >= 0) "D" else "B",
    )

private fun formatDistance(metres: Float): String =
    if (metres < 1_000) "${metres.toInt()} m · kuş uçuşu"
    else String.format(Locale("tr", "TR"), "%.1f km · kuş uçuşu", metres / 1_000)

private fun pointTypeLabel(type: MapPointType): String = when (type) {
    MapPointType.ASSEMBLY_AREA -> "Toplanma alanı"
    MapPointType.SHELTER_TENT -> "Geçici barınma alanı"
    MapPointType.SAHRA_HOSPITAL -> "Sahra hastanesi"
    MapPointType.CLOSED_ROAD -> "Yol kapanışı bildirimi"
    MapPointType.INCIDENT -> "İhbar"
    MapPointType.HEALTH_FACILITY -> "Sağlık kuruluşu"
    MapPointType.PHARMACY -> "Eczane"
    MapPointType.FIRE_STATION -> "İtfaiye"
    MapPointType.POLICE_STATION -> "Polis"
}
