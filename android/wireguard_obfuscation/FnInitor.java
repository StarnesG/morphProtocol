package com.morph_vpn.plugin.wireguard_obfuscation;
import java.util.Arrays;
import org.json.JSONObject;
import org.json.JSONException;

public class FnInitor {
    public Integer randomValue;
    public Integer[] substitutionTable;
    
    public FnInitor(Integer randomValue, Integer[] substitutionTable) {
       this.randomValue = randomValue;
       this.substitutionTable = substitutionTable;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"randomValue\":").append(randomValue).append(",");
        sb.append("\"substitutionTable\":").append(Arrays.toString(substitutionTable));
        sb.append("}");
        return sb.toString();
    }

    public JSONObject toJSONObject() {
        JSONObject fnInitorObject = new JSONObject();
        try {
            fnInitorObject.put("randomValue", randomValue);
            fnInitorObject.put("substitutionTable", substitutionTable);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        
        return fnInitorObject;
    }
}