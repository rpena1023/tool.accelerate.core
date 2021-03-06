/*******************************************************************************
 * Copyright (c) 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
package com.ibm.liberty.starter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.SAXException;

import com.ibm.liberty.starter.api.v1.model.provider.Dependency;
import com.ibm.liberty.starter.api.v1.model.provider.Dependency.Scope;

public class PomModifier {

    private Document doc;
    private Map<String, Dependency> providedPomsToAdd = new HashMap<>();
    private Map<String, Dependency> runtimePomsToAdd = new HashMap<>();
    private Map<String, Dependency> compilePomsToAdd = new HashMap<>();
    private String groupIdBase = "net.wasdev.wlp.starters.";

    public void setInputStream(InputStream pomInputStream) throws SAXException, IOException, ParserConfigurationException {
        DocumentBuilderFactory domFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder db = domFactory.newDocumentBuilder();
        doc = db.parse(pomInputStream);
    }

    public void addStarterPomDependencies(DependencyHandler depHand) {
        // Actually add nodes when writing POM at end to stop duplicates, it won't stop dup's across invocations of writeToStream but that is OK at the moment
        addDependency(Dependency.Scope.PROVIDED, depHand.getProvidedDependency());
        addDependency(Dependency.Scope.RUNTIME, depHand.getRuntimeDependency());
        addDependency(Dependency.Scope.COMPILE, depHand.getCompileDependency());
    }
    
    private void addDependency(Dependency.Scope scope, Map<String, Dependency> mapToAdd) {
        System.out.println("Setting map for dependencies with scope " + scope + " to " + mapToAdd.toString());
        switch (scope) {
            case PROVIDED :
                providedPomsToAdd = mapToAdd;
                break;
            case RUNTIME :
                runtimePomsToAdd = mapToAdd;
                break;
            case COMPILE :
                compilePomsToAdd = mapToAdd;
                break;
        }
    }

    public byte[] getBytes() throws TransformerException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        writeToStream(baos);
        return baos.toByteArray();
    }

    private void writeToStream(OutputStream pomOutputStream) throws TransformerException {
        Node dependenciesNode = doc.getElementsByTagName("dependencies").item(0);
        System.out.println("Appending dependency nodes for provided poms");
        appendDependencyNodes(dependenciesNode, providedPomsToAdd);
        System.out.println("Appending dependency nodes for runtime poms");
        appendDependencyNodes(dependenciesNode, runtimePomsToAdd);
        System.out.println("Appending dependency nodes for compile poms");
        appendDependencyNodes(dependenciesNode, compilePomsToAdd);
        TransformerFactory transformFactory = TransformerFactory.newInstance();
        Transformer transformer = transformFactory.newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "4");

        DOMSource domSource = new DOMSource(doc);

        StreamResult streamResult = new StreamResult(pomOutputStream);
        transformer.transform(domSource, streamResult);
    }

    private void appendDependencyNodes(Node dependenciesNode, Map<String, Dependency> dependencies) {
        Set<String> serviceIds = dependencies.keySet();
        System.out.println("Appending nodes for services " + serviceIds);
        for (String serviceId : serviceIds) {
            Dependency dependency = dependencies.get(serviceId);
            String groupId = groupIdBase + serviceId;
            appendDependencyNode(dependenciesNode, groupId, dependency.getArtifactId(), dependency.getScope(), dependency.getVersion());
        }
    }

    private void appendDependencyNode(Node dependenciesNode, String dependencyGroupId, String dependencyArtifactId, Scope dependencyScope, String dependencyVersion) {
        System.out.println("PomModifier adding dependency with groupId:" + dependencyGroupId
                           + " artifactId:" + dependencyGroupId + " scope:" + dependencyScope
                           + " dependencyVersion" + dependencyVersion);
        Node newDependency = doc.createElement("dependency");
        Node groupId = doc.createElement("groupId");
        groupId.setTextContent(dependencyGroupId);

        Node artifactId = doc.createElement("artifactId");
        artifactId.setTextContent(dependencyArtifactId);

        Node version = doc.createElement("version");
        version.setTextContent(dependencyVersion);

        Node type = doc.createElement("type");
        type.setTextContent("pom");

        Node scope = doc.createElement("scope");
        scope.setTextContent(dependencyScope.name().toLowerCase());

        newDependency.appendChild(groupId);
        newDependency.appendChild(artifactId);
        newDependency.appendChild(version);
        newDependency.appendChild(type);
        newDependency.appendChild(scope);
        dependenciesNode.appendChild(newDependency);
    }

}
