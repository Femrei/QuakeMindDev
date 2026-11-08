package com.quakemind.feature.checklist

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.quakemind.core.designsystem.*
import com.quakemind.core.network.api.RiskResult

@Composable
fun RiskScreen(
    onBack: () -> Unit,
    result: RiskResult? = null,
    isLoading: Boolean = false,
    error: String? = null,
    onAnalyze: (String, String) -> Unit = { _, _ -> },
) {
    var latitude by remember { mutableStateOf("") }
    var longitude by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Geri", tint = Zinc950)
            }
            Column {
                Text("Bölgesel Zemin & Yapı Riski", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Zinc950)
                Text("Konum girilince sunucudan risk değerlendirmesi istenir", fontSize = 12.sp, color = Zinc500)
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxWidth().weight(1f),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 18.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(key = "risk_coordinates") {
                ShadcnCard {
                    Text("Değerlendirilecek koordinatlar", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Zinc950)
                    Spacer(Modifier.height(8.dp))
                    Text("Konumunuz otomatik alınmıyor. Enlem ve boylamı kendiniz girin.", fontSize = 12.sp, color = Zinc600)
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = latitude, onValueChange = { latitude = it },
                        label = { Text("Enlem (ör. 40.0)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                    )
                    OutlinedTextField(
                        value = longitude, onValueChange = { longitude = it },
                        label = { Text("Boylam (ör. 29.0)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                    )
                    Spacer(Modifier.height(10.dp))
                    Button(
                        onClick = { onAnalyze(latitude, longitude) },
                        enabled = !isLoading && latitude.isNotBlank() && longitude.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = AfetCrimson),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (isLoading) "Risk verisi alınıyor..." else "Bölgesel Riski Sorgula")
                    }
                }
            }

            if (error != null) item(key = "risk_error") {
                Text(error, fontSize = 13.sp, color = AfetCrimson)
            }
            if (result == null && !isLoading && error == null) item(key = "risk_empty") {
                Text("Henüz ölçüm veya model çıktısı alınmadı. Bölgesel risk puanı gösterilmiyor.", color = Zinc600, fontSize = 13.sp)
            }
            if (result != null) {
                item(key = "risk_score") {
                    ShadcnCard {
                        Text("Sunucudan Gelen Bölgesel Risk Puanı", fontWeight = FontWeight.Bold, color = Zinc950)
                        Spacer(Modifier.height(8.dp))
                        Text("${result.score}", fontSize = 36.sp, fontWeight = FontWeight.Black, color = AfetCrimson)
                        Text("Güncelleme: ${result.updatedAt}", fontSize = 12.sp, color = Zinc600)
                        Text("Bu değerlendirme bina güvenliği veya yerinde zemin etüdü yerine geçmez.", fontSize = 12.sp, color = Zinc600)
                    }
                }
                item(key = "risk_factors_header") {
                    Text("Servisin Bildirdiği Etkenler", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Zinc950)
                }
                if (result.factors.isEmpty()) item(key = "risk_factors_empty") {
                    Text("Ayrıntılı etken verisi sunulmadı.", color = Zinc600, fontSize = 13.sp)
                }
                itemsIndexed(
                    items = result.factors,
                    key = { index, _ -> index },
                    contentType = { _, _ -> "risk_factor" },
                ) { _, factor ->
                    Surface(shape = Shape8dp, color = Zinc50, border = BorderZinc200) {
                        Text(factor, modifier = Modifier.fillMaxWidth().padding(14.dp), fontSize = 13.sp, color = Zinc800)
                    }
                }
            }
        }
    }
}
